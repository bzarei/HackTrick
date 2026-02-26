import { I18NLoader } from "./I18NLoader"
import { LocaleManager } from "../locale"
import { MissingTranslationHandler } from "./MissingTranslationHandler"
import { Translator } from "./Translator"
import { DefaultMissingTranslationHandler } from "./translator/DefaultMissingTranslationHandler"
import { StandardTranslator } from "./translator/StandardTranslator"

/**
 * <code>TranslatorBuilder</code> is s simple fluent builder used to construct a {@link Translator} instance
 */
export class TranslatorBuilder {
    // instance data

    private _missingTranslationHandler: MissingTranslationHandler | undefined
    private _I18NLoader: I18NLoader | undefined
    private _localeManager: LocaleManager | undefined

    // fluent

    /**
     * set the loader
     * @param loader an {@link I18NLoader}
     */
    loader(loader: I18NLoader): TranslatorBuilder {
        this._I18NLoader = loader
        return this
    }

    /**
     * set the locale manager
     * @param manager an {@link LocaleManager}
     */
    localeManager(manager: LocaleManager): TranslatorBuilder {
        this._localeManager = manager
        return this
    }

    /**
     * set the {@link MissingTranslationHandler}
     * @param handler the  {@link MissingTranslationHandler}
     */
    missingTranslationHandler(handler: MissingTranslationHandler): TranslatorBuilder {
        this._missingTranslationHandler = handler

        return this
    }

    // build

    /**
     * create and return the resulting {@Translator}
     */
    build(): Translator {
        // add defaults

        if (!this._missingTranslationHandler) this._missingTranslationHandler = new DefaultMissingTranslationHandler()

        // validate

        if (!this._I18NLoader) throw new Error("translator needs a loader")

        // done

        return new StandardTranslator(this._I18NLoader, this._missingTranslationHandler, this._localeManager!)
    }
}
