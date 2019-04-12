class Message<T>{
	constructor(public val:T, public key: string){}
}

class AQSubscriber4<T> {
    constructor(public name: string, public key: string, public queue: AsyncQueue4<T>) { }

    async pull(): Promise<void> {
        await this.queue.semaphore.wait();
        this.queue.dequeue().then(res => {
            this.log(res.val);
        })
        this.pull();
    }

    log(message: T) {
        console.log(this.name + " : " + message);
    }
}

class AQPublisher4<T> {
    async push(queue: AsyncQueue4<T>, msg: Message<T>): Promise<void> {
        queue.enqueue(msg);
    }
}

class AsyncQueue4<T> {
    public queue: Array<Message<T>> = new Array()
    protected queuedPromises: Array<any> = new Array()

    constructor(public semaphore: AsyncSemaphore4<T>) { }

    async enqueue(msg: Message<T>): Promise<void> {
        if (this.queuedPromises.length > 0)
            this.queuedPromises.shift()(msg);
        this.queue.push(msg);
        this.semaphore.signal();
    }

    async dequeue(): Promise<Message<T>> {
        if (this.queue.length > 0)
            return Promise.resolve(this.queue.shift())
        else
            return new Promise(res => this.queuedPromises.push(res))
    }
}

class AsyncSemaphore4<T> {
    private promiseResolverQueue: Array<(v: boolean) => void> = []

    constructor(private count: number = 0) {}

    signal(): void {
        //se houver promises em espera, quando o count aumentar tem de a resolver
        this.count++;

        if (this.promiseResolverQueue.length > 0) {
            this.count--;
            this.promiseResolverQueue.shift()(true)
        }
    }

    async wait(): Promise<boolean> {
        //if (count == 0) tem de arranjar maneira de ficar à espera que o count aumente (promise)
        //se já houver alguma promise em espera, não pode passar à frente das outras promises
        if (this.count == 0 || this.promiseResolverQueue.length > 0)
            return new Promise<boolean>(res => this.promiseResolverQueue.push(res))
        this.count--;
    }
}


class Broker<T>{
    public queues: Array<AsyncQueue4<T>> = [];
    private subscribers: Array<AQSubscriber4<T>> = [];

    publish( queue: AsyncQueue4<T> ){
        this.queues.push(queue);
    }

	subscribe( subscriber: AQSubscriber4<T> ){
		this.subscribers.push(subscriber);
	}

	handleRejection(p: Promise<any>) {
    	return p.catch( err=> ({ error: err }));
	}

	async pull(): Promise<void> {

        let sWait = this.queues.map( (queue,index) => { 
            queue.semaphore.wait().then( () => {
                this.queues[index].dequeue().then( res => {
                    this.subscribers.forEach( (sub, subIdx) => {
                        if(sub.key == res.key){
                            sub.queue.enqueue(res);
                        }
                    })
                })
            })
        })

        await Promise.race(
        	sWait
        );

        this.pull();
    }
}

async function ex4Alt() {    //multiple publishers, multiple subscribers
    let inQueue1 = new AsyncQueue4(new AsyncSemaphore4())
    let inQueue2 = new AsyncQueue4(new AsyncSemaphore4())
    let outQueue1 = new AsyncQueue4(new AsyncSemaphore4())
    let outQueue2 = new AsyncQueue4(new AsyncSemaphore4())
    let outQueue3 = new AsyncQueue4(new AsyncSemaphore4())
    let outQueue4 = new AsyncQueue4(new AsyncSemaphore4())
    let broker = new Broker()
    let p1 = new AQPublisher4()
    let s1 = new AQSubscriber4('s1','a',outQueue1)
    let s2 = new AQSubscriber4('s2','a',outQueue2)
    let s3 = new AQSubscriber4('s3','b',outQueue3)
    let s4 = new AQSubscriber4('s4','c',outQueue4)
    s1.pull()
    s2.pull()
    s3.pull()
    s4.pull()
    broker.publish(inQueue1)
    broker.publish(inQueue2)
    broker.subscribe(s1)
    broker.subscribe(s2)
    broker.subscribe(s3)
    broker.subscribe(s4)
    p1.push(inQueue1, new Message('ola','b'))
    p1.push(inQueue1, new Message('ola','a'))
    p1.push(inQueue2, new Message('ola','c'))
    p1.push(inQueue2, new Message('ola','a'))

    broker.pull()
}

ex4Alt();