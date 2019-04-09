class AQSubscriber3<T> {
    constructor(public name: string) { }

    update(message: T) {
        console.log(this.name + " : " + message);
    }
}

class AQPublisher3<T> {
    async push(queue: AsyncQueue3<T>, arg: T): Promise<void> {
        queue.enqueue(arg);
    }
}

class AsyncQueue3<T> {
    public queue: Array<T> = new Array()
    protected queuedPromises: Array<any> = new Array()

    constructor(private semaphore: AsyncSemaphore3<T>) { }

    async enqueue(arg: T): Promise<void> {
        if (this.queuedPromises.length > 0)
            this.queuedPromises.shift()(arg)
        this.queue.push(arg)
        this.semaphore.signal()
    }

    async dequeue(): Promise<T> {
        if (this.queue.length > 0)
            return Promise.resolve(this.queue.shift())
        else
            return new Promise(res => this.queuedPromises.push(res))
    }
}

class SubscriptionManager<T> {
    constructor(private queue: AsyncQueue3<T>, private semaphore: AsyncSemaphore3<T>, private subscribers: AQSubscriber3<T>[] = []) { }

    subscribe(subscriber: AQSubscriber3<T>) {
        this.subscribers.push(subscriber);
    }

    async pull(): Promise<void> {
        await this.semaphore.wait();
        this.queue.dequeue().then(res => {
            this.notifySubscribers(res);
        })
        this.pull();

        // setTimeout(() => {
        //     this.queue.dequeue().then(res => {
        //         this.notifySubscribers(res)
        //     })
        //     this.pull();
        // }, 1)
    }

    notifySubscribers(data: T): void {
        this.subscribers.forEach((sub) => sub.update(data))
    }
}

class AsyncSemaphore3<T> {
    private promiseResolverQueue: Array<(v: boolean) => void> = []

    constructor(private count: number) {}

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

let semaphore = new AsyncSemaphore3(0)
let queue = new AsyncQueue3(semaphore)
let broker = new SubscriptionManager(queue, semaphore)
let p1 = new AQPublisher3()
let s1 = new AQSubscriber3('s1')
let s2 = new AQSubscriber3('s2')
let s3 = new AQSubscriber3('s3')
broker.subscribe(s1);
broker.subscribe(s2);
broker.subscribe(s3);

broker.pull();

p1.push(queue, 'ola')
p1.push(queue, 'ola1')
p1.push(queue, 'ola2')
