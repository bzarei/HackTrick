class MessageBus {
    handlers = new Map();
    subscribe(topic, handler) {
        if (!this.handlers.has(topic)) {
            this.handlers.set(topic, new Set());
        }
        this.handlers.get(topic).add(handler);
        return () => this.unsubscribe(topic, handler);
    }
    unsubscribe(topic, handler) {
        this.handlers.get(topic)?.delete(handler);
    }
    publish(msg) {
        const subs = this.handlers.get(msg.topic);
        if (!subs)
            return;
        subs.forEach((h) => {
            try {
                h(msg);
            }
            catch (e) {
                console.warn("[MessageBus] handler error", e);
            }
        });
    }
}
export const messageBus = new MessageBus();
//# sourceMappingURL=message-bus.js.map