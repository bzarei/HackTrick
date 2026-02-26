import { formatter } from "../registerFormatter.decorator"
import { ValueFormatter } from "../ValueFormatter"

/**
 * formatting options for numbers
 */
export interface NumberFormatOptions extends Intl.NumberFormatOptions {
    /**
     * an optional locale
     */
    locale?: string
}
/**
 * formatter for numbers
 */
@formatter("number")
export class NumberFormatter implements ValueFormatter<number, NumberFormatOptions> {
    // implement ValueFormatter

    /**
     * @inheritdoc
     */
    format(locale: Intl.Locale, value: number, format: NumberFormatOptions): string {
        return new Intl.NumberFormat(format?.locale ? format.locale : locale.baseName, format).format(value)
    }
}
