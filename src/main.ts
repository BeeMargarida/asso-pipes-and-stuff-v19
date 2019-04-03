class AQSubscriber<T> {
    constructor(public name: string) { }

    async pull(queue: Queue<T>): Promise<void> {
        queue.dequeue().then(res => console.log(this.name + " " + res))
    }
}

class AQPublisher<T> {
    async push(queue: Queue<T>, arg: T): Promise<void> {
        queue.enqueue(arg);
    }
}

abstract class Queue<T> {
    abstract enqueue(arg: T): void
    abstract dequeue(): Promise<T>
}

class AsyncQueue<T> extends Queue<T> {
    public queue: Array<T> = new Array()
    protected queuedPromises: Array<any> = new Array()

    async enqueue(arg: T): Promise<void> {
        if (this.queuedPromises.length > 0)
            this.queuedPromises.shift()(arg)
        else
            this.queue.push(arg)
    }

    async dequeue(): Promise<T> {
        if (this.queue.length > 0)
            return Promise.resolve(this.queue.shift())
        else
            return new Promise(res => this.queuedPromises.push(res))
    }
}

class AsyncSemaphore<T> {
    private promiseResolverQueue: Array<(v: boolean) => void> = []

    constructor(private count: number) {}

    signal(): void {
        //se houver promises em espera, quando o count aumentar tem de a resolver
        this.count++;

        if (this.promiseResolverQueue.length > 0) {
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

class UnboundedAsyncQueue<T> extends Queue<T> {
    public queue: Array<T> = new Array()
    // protected queuedPromises: Array<any> = new Array()
    private sem: AsyncSemaphore<T> = new AsyncSemaphore<T>(0)

    async enqueue(arg: T): Promise<void> {
        this.queue.push(arg)
        this.sem.signal()
    }

    async dequeue(): Promise<T> {
        await this.sem.wait()
        return this.queue.shift()
    }
}

class BoundedAsyncQueue<T> extends Queue<T> {
    private size: number = 10
    public queue: Array<T> = new Array()
    // protected queuedPromises: Array<any> = new Array()
    private enqueueSem: AsyncSemaphore<T> = new AsyncSemaphore<T>(0)
    private dequeueSem: AsyncSemaphore<T> = new AsyncSemaphore<T>(this.size)

    async enqueue(arg: T): Promise<void> {
        await this.dequeueSem.wait()
        this.queue.push(arg)
        this.enqueueSem.signal()
    }

    async dequeue(): Promise<T> {
        await this.enqueueSem.wait()
        this.dequeueSem.signal()
        return this.queue.shift()
    }
}

async function ex1() {    //1 publisher, 1 subscriber, works async
    let queue = new AsyncQueue()
    let p1 = new AQPublisher()
    let s1 = new AQSubscriber('s1')
    s1.pull(queue)
    p1.push(queue, 'ola')
}

async function ex2() {    //1 publisher, 3 subscribers, each takes 1 message from queue
    let queue = new AsyncQueue()
    let p1 = new AQPublisher()
    let s1 = new AQSubscriber('s1')
    let s2 = new AQSubscriber('s2')
    let s3 = new AQSubscriber('s3')
    s1.pull(queue)
    s2.pull(queue)
    s3.pull(queue)
    p1.push(queue, 'ola')
    p1.push(queue, 'ola')
    p1.push(queue, 'ola')
}

async function ex3() {    //1 publisher, multiple subscribers, with semaphore and unboundedQueue
    let queue = new UnboundedAsyncQueue()
    let p1 = new AQPublisher()
    let s1 = new AQSubscriber('s1')
    let s2 = new AQSubscriber('s2')
    let s3 = new AQSubscriber('s3')
    s1.pull(queue)
    s2.pull(queue)
    s3.pull(queue)
    p1.push(queue, 'ola')
}

async function ex4() {    //1 publisher, multiple subscribers, with semaphore and boundedQueue
    let queue = new BoundedAsyncQueue()
    let p1 = new AQPublisher()
    let s1 = new AQSubscriber('s1')
    let s2 = new AQSubscriber('s2')
    let s3 = new AQSubscriber('s3')
    s1.pull(queue)
    s2.pull(queue)
    s3.pull(queue)
    p1.push(queue, 'ola')
    p1.push(queue, 'ola')
    p1.push(queue, 'ola')
    p1.push(queue, 'ola')
}
