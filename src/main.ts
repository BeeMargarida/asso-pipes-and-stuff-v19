class AQSubscriber<T> {
    constructor(public name: string) {}

    async pull(queue: AsyncQueue<T>): Promise<void> {
        queue.dequeue().then(res => console.log(this.name + " " + res))
    }
}

class AQPublisher<T> {
    async push(queue: AsyncQueue<T>, arg: T): Promise<void> {
        queue.enqueue(arg);
    }
}

class AsyncQueue<T> {
    public queue: Array<T> = new Array()
    protected queuedPromises: Array<any> = new Array()

    async enqueue(arg: T): Promise<void> {
        if(this.queuedPromises.length > 0)
            this.queuedPromises.shift()(arg)
        else
            this.queue.push(arg)
    }
    
    async dequeue(): Promise<T> {
        if(this.queue.length > 0)
            return Promise.resolve(this.queue.shift())
        else
            return new Promise(res => this.queuedPromises.push(res))
    }
}

let queue = new AsyncQueue()
let p1 = new AQPublisher()
let s1 = new AQSubscriber('s1')
let s2 = new AQSubscriber('s2')
let s3 = new AQSubscriber('s3')

s1.pull(queue)
s2.pull(queue)
s3.pull(queue)
p1.push(queue,'ola')
p1.push(queue,'ola')
p1.push(queue,'ola')


class AsyncSemaphore<T> {
    private count: number = 0

    signal(): void {
        //se houver promises em espera, quando o count aumentar tem de a resolver
        this.count++;
    }

    async wait(): Promise<void> {
        //if (count == 0) tem de arranjar maneira de ficar à espera que o count aumente (promise)
        //se já houver alguma promise em espera, não pode passar à frente das outras promises
        this.count--;
    }
}