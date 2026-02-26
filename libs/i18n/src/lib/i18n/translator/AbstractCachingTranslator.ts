import { Translations, Translator } from "../Translator"
import { MissingTranslationHandler } from "../MissingTranslationHandler"

/**
 * an {@link AbstractCachingTranslator} is an abstract base class for translators that cache loaded translations
 */
export abstract class AbstractCachingTranslator extends Translator {
    // instance data

    protected cachedNamespaces: { [key: string]: any } = {}
    protected reloading = false
    //@logger("i18n")
    //protected logger: Logger | undefined

    // constructor

    protected constructor(protected missingTranslationHandler: MissingTranslationHandler) {
        super()
    }

    // protected

    protected isLoaded(namespace: string): boolean {
        return this.cachedNamespaces[namespace] != undefined
    }

    // private

    // name.space.name OR
    // name.space:path.name
    protected extractNamespace(key: string): { namespace: string; path: string } {
        let namespace: string
        let path: string
        const colon = key.indexOf(":")
        if (colon > 0) {
            namespace = key.substring(0, colon)
            path = key.substring(colon + 1)
        } else {
            // assume that everything but the last is the namespace

            const byDots = key.split(".")

            const name = byDots.pop()

            namespace = byDots.join(".")
            path = `${name}.${name}`
        }

        return { namespace: namespace, path: path }
    }

    // implement Translator

    /**
     * @inheritDoc
     */
    override findTranslationFor(namespace: string): Translations {
        return this.cachedNamespaces[namespace]
    }

    /**
     * @inheritDoc
     */
    override translate(key: string): string {
        const { namespace, path } = this.extractNamespace(key)

        const translation = this.get<string>(this.cachedNamespaces[namespace], path)

        return translation || this.missingTranslationHandler.resolve(key)
    }

    // protected

    protected get<T>(values: any, key: string): T | undefined {
        const path = key.split(".")

        let index = 0
        const length = path.length

        let object = values

        while (object != null && index < length) object = Reflect.get(object, path[index++])

        return index && index == length ? <T>object : undefined
    }
}
