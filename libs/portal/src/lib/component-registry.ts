export type ComponentLoader = () => Promise<{ default: React.ComponentClass<any> }>;

export class ComponentRegistry {
    private static map = new Map<string, ComponentLoader>();

    static register(name: string, loader: ComponentLoader) {
        this.map.set(name, loader);
    }

    static get(name: string) {
        const loader = ComponentRegistry.map.get(name);
        if (!loader) throw new Error(`Component ${name} not registered`);
        return loader;
    }
}