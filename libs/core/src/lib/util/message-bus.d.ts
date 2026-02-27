export type Message<T = any> = {
    topic: string;
    message: string;
    payload?: T;
};
type Handler = (msg: Message) => void;
declare class MessageBus {
    private handlers;
    subscribe(topic: string, handler: Handler): () => void;
    unsubscribe(topic: string, handler: Handler): void;
    publish(msg: Message): void;
}
export declare const messageBus: MessageBus;
export {};
//# sourceMappingURL=message-bus.d.ts.map