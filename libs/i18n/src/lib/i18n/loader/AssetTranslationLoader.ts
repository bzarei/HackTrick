
import { I18NLoader } from "../I18NLoader"


export interface AssetTranslationLoaderConfig {
    path?: string
}

/**
 * a {@link I18NLoader} tah will load translations form the static assets
 */
export class AssetTranslationLoader implements I18NLoader {
    // instance data


    private loading: { [key: string]: Promise<any> } = {}
    private path = "/i18n/"

    // constructor

    constructor(config: AssetTranslationLoaderConfig) {
        this.path = config.path || "/i18n/"
    }

    // implement I18nLoader

    /**
     * @inheritDoc
     */
    loadNamespace(locale: Intl.Locale, namespace: string): Promise<any> {
        const key = `${locale.baseName}.${namespace}`
        const loading = this.loading[key]

        if (loading) {
            return loading
        }
        else {
            //this.logger.info(`loading namespace '${namespace}' for locale '${locale.baseName}'`)

            return (this.loading[key] = fetch(`${this.path}${namespace}/${locale.baseName}.json`).then((response) =>
                response.json()
            ))
        }
    }
}
