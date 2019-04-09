var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class AQSubscriber3 {
    constructor(name) {
        this.name = name;
    }
    update(message) {
        console.log(this.name + " : " + message);
    }
}
class AQPublisher3 {
    push(queue, arg) {
        return __awaiter(this, void 0, void 0, function* () {
            queue.enqueue(arg);
        });
    }
}
class AsyncQueue3 {
    constructor(semaphore) {
        this.semaphore = semaphore;
        this.queue = new Array();
        this.queuedPromises = new Array();
    }
    enqueue(arg) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.queuedPromises.length > 0)
                this.queuedPromises.shift()(arg);
            this.queue.push(arg);
            this.semaphore.signal();
        });
    }
    dequeue() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.queue.length > 0)
                return Promise.resolve(this.queue.shift());
            else
                return new Promise(res => this.queuedPromises.push(res));
        });
    }
}
class SubscriptionManager {
    constructor(queue, semaphore, subscribers = []) {
        this.queue = queue;
        this.semaphore = semaphore;
        this.subscribers = subscribers;
    }
    subscribe(subscriber) {
        this.subscribers.push(subscriber);
    }
    pull() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.semaphore.wait();
            this.queue.dequeue().then(res => {
                this.notifySubscribers(res);
            });
            this.pull();
            // setTimeout(() => {
            //     this.queue.dequeue().then(res => {
            //         this.notifySubscribers(res)
            //     })
            //     this.pull();
            // }, 1)
        });
    }
    notifySubscribers(data) {
        this.subscribers.forEach((sub) => sub.update(data));
    }
}
class AsyncSemaphore3 {
    constructor(count) {
        this.count = count;
        this.promiseResolverQueue = [];
    }
    signal() {
        //se houver promises em espera, quando o count aumentar tem de a resolver
        this.count++;
        if (this.promiseResolverQueue.length > 0) {
            this.count--;
            this.promiseResolverQueue.shift()(true);
        }
    }
    wait() {
        return __awaiter(this, void 0, void 0, function* () {
            //if (count == 0) tem de arranjar maneira de ficar à espera que o count aumente (promise)
            //se já houver alguma promise em espera, não pode passar à frente das outras promises
            if (this.count == 0 || this.promiseResolverQueue.length > 0)
                return new Promise(res => this.promiseResolverQueue.push(res));
            this.count--;
        });
    }
}
let semaphore = new AsyncSemaphore3(0);
let queue = new AsyncQueue3(semaphore);
let broker = new SubscriptionManager(queue, semaphore);
let p1 = new AQPublisher3();
let s1 = new AQSubscriber3('s1');
let s2 = new AQSubscriber3('s2');
let s3 = new AQSubscriber3('s3');
broker.subscribe(s1);
broker.subscribe(s2);
broker.subscribe(s3);
broker.pull();
p1.push(queue, 'ola');
p1.push(queue, 'ola1');
p1.push(queue, 'ola2');
//# sourceMappingURL=scenario3.js.map