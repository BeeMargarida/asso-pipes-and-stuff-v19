var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class Message {
    constructor(val, key) {
        this.val = val;
        this.key = key;
    }
}
class AQSubscriber4 {
    constructor(name, key, queue) {
        this.name = name;
        this.key = key;
        this.queue = queue;
    }
    pull() {
        return __awaiter(this, void 0, void 0, function* () {
            // console.log(this.name+" pull");
            yield this.queue.semaphore.wait();
            this.queue.dequeue().then(res => {
                this.log(res.val);
            });
            this.pull();
        });
    }
    log(message) {
        console.log(this.name + " : " + message);
    }
}
class AQPublisher4 {
    push(queue, msg) {
        return __awaiter(this, void 0, void 0, function* () {
            queue.enqueue(msg);
        });
    }
}
class AsyncQueue4 {
    constructor(semaphore) {
        this.semaphore = semaphore;
        this.queue = new Array();
        this.queuedPromises = new Array();
    }
    enqueue(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.queuedPromises.length > 0)
                this.queuedPromises.shift()(msg);
            this.queue.push(msg);
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
class AsyncSemaphore4 {
    constructor(count = 0) {
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
class Broker {
    constructor() {
        this.queues = [];
        this.subscribers = [];
    }
    publish(queue) {
        this.queues.push(queue);
    }
    subscribe(subscriber) {
        this.subscribers.push(subscriber);
    }
    handleRejection(p) {
        return p.catch(err => ({ error: err }));
    }
    pull() {
        return __awaiter(this, void 0, void 0, function* () {
            let sWait = this.queues.map((queue, index) => {
                queue.semaphore.wait().then(() => {
                    this.queues[index].dequeue().then(res => {
                        this.subscribers.forEach((sub, subIdx) => {
                            if (sub.key == res.key) {
                                sub.queue.enqueue(res);
                            }
                        });
                    });
                });
            });
            yield Promise.race(sWait);
            this.pull();
        });
    }
}
function ex4Alt() {
    return __awaiter(this, void 0, void 0, function* () {
        let inQueue1 = new AsyncQueue4(new AsyncSemaphore4());
        let inQueue2 = new AsyncQueue4(new AsyncSemaphore4());
        let outQueue1 = new AsyncQueue4(new AsyncSemaphore4());
        let outQueue2 = new AsyncQueue4(new AsyncSemaphore4());
        let outQueue3 = new AsyncQueue4(new AsyncSemaphore4());
        let outQueue4 = new AsyncQueue4(new AsyncSemaphore4());
        let broker = new Broker();
        let p1 = new AQPublisher4();
        let s1 = new AQSubscriber4('s1', 'a', outQueue1);
        let s2 = new AQSubscriber4('s2', 'a', outQueue2);
        let s3 = new AQSubscriber4('s3', 'b', outQueue3);
        let s4 = new AQSubscriber4('s4', 'c', outQueue4);
        s1.pull();
        s2.pull();
        s3.pull();
        s4.pull();
        broker.publish(inQueue1);
        broker.publish(inQueue2);
        broker.subscribe(s1);
        broker.subscribe(s2);
        broker.subscribe(s3);
        broker.subscribe(s4);
        p1.push(inQueue1, new Message('ola', 'b'));
        p1.push(inQueue1, new Message('ola', 'a'));
        p1.push(inQueue2, new Message('ola', 'c'));
        p1.push(inQueue2, new Message('ola', 'a'));
        broker.pull();
    });
}
ex4Alt();
//# sourceMappingURL=scenario4.js.map