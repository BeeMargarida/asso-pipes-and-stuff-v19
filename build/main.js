var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class AQSubscriber {
    constructor(name) {
        this.name = name;
    }
    pull(queue) {
        return __awaiter(this, void 0, void 0, function* () {
            queue.dequeue().then(res => console.log(this.name + " " + res));
        });
    }
}
class AQPublisher {
    push(queue, arg) {
        return __awaiter(this, void 0, void 0, function* () {
            queue.enqueue(arg);
        });
    }
}
class Queue {
}
class AsyncQueue extends Queue {
    constructor() {
        super(...arguments);
        this.queue = new Array();
        this.queuedPromises = new Array();
    }
    enqueue(arg) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.queuedPromises.length > 0)
                this.queuedPromises.shift()(arg);
            else
                this.queue.push(arg);
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
class AsyncSemaphore {
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
class UnboundedAsyncQueue extends Queue {
    constructor() {
        super(...arguments);
        this.queue = new Array();
        // protected queuedPromises: Array<any> = new Array()
        this.sem = new AsyncSemaphore(0);
    }
    enqueue(arg) {
        return __awaiter(this, void 0, void 0, function* () {
            this.queue.push(arg);
            this.sem.signal();
        });
    }
    dequeue() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sem.wait();
            return this.queue.shift();
        });
    }
}
class BoundedAsyncQueue extends Queue {
    constructor() {
        super(...arguments);
        this.size = 10;
        this.queue = new Array();
        // protected queuedPromises: Array<any> = new Array()
        this.enqueueSem = new AsyncSemaphore(0);
        this.dequeueSem = new AsyncSemaphore(this.size);
    }
    enqueue(arg) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.dequeueSem.wait();
            this.queue.push(arg);
            this.enqueueSem.signal();
        });
    }
    dequeue() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.enqueueSem.wait();
            this.dequeueSem.signal();
            return this.queue.shift();
        });
    }
}
function ex1() {
    return __awaiter(this, void 0, void 0, function* () {
        let queue = new AsyncQueue();
        let p1 = new AQPublisher();
        let s1 = new AQSubscriber('s1');
        s1.pull(queue);
        p1.push(queue, 'ola');
    });
}
function ex2() {
    return __awaiter(this, void 0, void 0, function* () {
        let queue = new AsyncQueue();
        let p1 = new AQPublisher();
        let s1 = new AQSubscriber('s1');
        let s2 = new AQSubscriber('s2');
        let s3 = new AQSubscriber('s3');
        s1.pull(queue);
        s2.pull(queue);
        s3.pull(queue);
        p1.push(queue, 'ola');
        p1.push(queue, 'ola');
        p1.push(queue, 'ola');
    });
}
function ex3() {
    return __awaiter(this, void 0, void 0, function* () {
        let queue = new UnboundedAsyncQueue();
        let p1 = new AQPublisher();
        let s1 = new AQSubscriber('s1');
        let s2 = new AQSubscriber('s2');
        let s3 = new AQSubscriber('s3');
        s1.pull(queue);
        s2.pull(queue);
        s3.pull(queue);
        p1.push(queue, 'ola');
    });
}
function ex4() {
    return __awaiter(this, void 0, void 0, function* () {
        let queue = new BoundedAsyncQueue();
        let p1 = new AQPublisher();
        let s1 = new AQSubscriber('s1');
        let s2 = new AQSubscriber('s2');
        let s3 = new AQSubscriber('s3');
        s1.pull(queue);
        s2.pull(queue);
        s3.pull(queue);
        p1.push(queue, 'ola');
        p1.push(queue, 'ola');
        p1.push(queue, 'ola');
        p1.push(queue, 'ola');
    });
}
//# sourceMappingURL=main.js.map