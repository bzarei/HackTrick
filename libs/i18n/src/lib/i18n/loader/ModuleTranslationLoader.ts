//import { Module, ModuleConfig } from "../../module"
import { I18NLoader } from "../I18NLoader"

/**
 * <code>ModuleTranslationLoader</code>is a {@link I18NLoader} that will load translations form the static assets
 * of individual modules.
 *
export class ModuleTranslationLoader implements I18NLoader {
    // static

    private static host: Map<string, Module<ModuleConfig>> = new Map()

    /**
     * register the module as a source for specific i18n namespaces.
     * @param namespace the namespace
     * @param module the module
     *
    public static register4Namespace(namespace: string, module: Module<ModuleConfig>): void {
        ModuleTranslationLoader.host.set(namespace, module)
    }

    // instance data

    //private logger: Logger
    private loading: { [key: string]: Promise<any> } = {}

    // constructor

    constructor() {
        this.logger = inject(LogManager).getLogger("i18n")
    }

    // implement I18nLoader

    /**
     * @inheritDoc
     *
    loadNamespace(locale: Intl.Locale, namespace: string): Promise<any> {
        const key = `${locale.baseName}.${namespace}`
        const loading = this.loading[key]

        if (loading) {
            return loading
        } else {
            const url = this.constructURL(locale, namespace)

            this.logger.info(`loading namespace '${namespace}' from '${url}'`)

            return (this.loading[key] = fetch(url).then((response) => response.json()))
        }
    }

    // private

    private constructURL(locale: Intl.Locale, namespace: string): string {
        const module: Module<ModuleConfig> | undefined = ModuleTranslationLoader.host.get(namespace)

        const isRelative = (location: string): boolean => {
            return location.startsWith(".")
        }

        const basePath = (): string => {
            const location = window.location // host / origin /

            return location.origin // including http<s> without trailing "/"
        }

        const location = (module: Module<ModuleConfig>): string => {
            let url = module.location

            if (isRelative(url))
                // ./mf/<module>/<js>.js
                url = basePath() + url.substring(1)

            url = url.substring(0, url.lastIndexOf("/"))

            return url
        }

        if (module) {
            const loc = location(module) + "/i18n/" + namespace.replaceAll(".", "/") + "/" + locale.baseName + ".json"

            return loc
        } else throw new Error(`no registered module for namespace ${namespace}`)
    }
}
*/