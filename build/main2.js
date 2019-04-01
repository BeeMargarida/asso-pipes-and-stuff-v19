class Publisher {
    constructor(queue) {
        this.queue = queue;
    }
    produce() {
        this.queue.push(new Message(1));
    }
}
class Subscriber {
    constructor(queue) {
        this.queue = queue;
    }
    consume() {
        let res = this.queue.pull();
        res.then(val => {
            console.log(res);
        });
    }
}
class Message {
    constructor(value) {
        this.value = value;
    }
}
Message.none = new Message(null);
class AsyncQueue {
    constructor(queue = []) {
        this.queue = queue;
    }
    push(msg) {
        this.queue.push(msg);
    }
    pull() {
        return new Promise((resolve, reject) => {
            let res;
            while ((res = this.queue.shift()) == undefined) { }
            return resolve(res);
        });
        // Promise.resolve(this.queue[0]);
    }
}
let queue = new AsyncQueue();
let p1 = new Publisher(queue);
let s1 = new Subscriber(queue);
s1.consume();
p1.produce();
//# sourceMappingURL=main2.js.map