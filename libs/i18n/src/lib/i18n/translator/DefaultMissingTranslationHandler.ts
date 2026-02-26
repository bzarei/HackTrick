
import { MissingTranslationHandler } from "../MissingTranslationHandler"

/**
 * The default implementation of a {@link MissingTranslationHandler} that simply wraps the key with '##' around it.
 */
export class DefaultMissingTranslationHandler implements MissingTranslationHandler {
    resolve(key: string): string {
        return `##${key}##`
    }
}
