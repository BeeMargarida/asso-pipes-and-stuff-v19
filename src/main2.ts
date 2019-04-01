
class Publisher{
	constructor(public queue: AsyncQueue) {}
	produce(): void{
		this.queue.push(new Message(1));
	}
}

class Subscriber{
	constructor(public queue: AsyncQueue) {}
	consume(): void{
		let res = this.queue.pull();
		res.then( val => {
			console.log(res);
		});
	}
}

class Message {
    constructor(public readonly value: any) { }
    static none = new Message(null)
}

class AsyncQueue {
    constructor(public queue: Array<Message> = []){ }
    push(msg: Message): void{
        this.queue.push(msg);
    }

    pull(): Promise<Message>{
        return new Promise((resolve, reject) => {
        	let res;
        	while((res = this.queue.shift()) == undefined){
        		console.log(res);
        	}
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
