import { FormatterRegistry } from "./FormatterRegistry"

export const formatter = (type: string): ClassDecorator => {
    return (formatterClass: any) => {
        import("./FormatterRegistry").then(() => {
            FormatterRegistry.register(type, new formatterClass())
        })
    }
}
