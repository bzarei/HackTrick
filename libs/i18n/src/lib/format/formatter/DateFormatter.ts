import { formatter } from "../registerFormatter.decorator"
import { ValueFormatter } from "../ValueFormatter"

/**
 * formatting options for dates
 */
export interface DateTimeFormatOptions extends Intl.DateTimeFormatOptions {
    /**
     * an optional locale
     */
    locale?: string
}
/**
 * formatter for dates according to the Intl.DateTimeFormat
 */
@formatter("date")
export class DateFormatter implements ValueFormatter<Date, DateTimeFormatOptions> {
    // implement ValueFormatter

    /**
     * @inheritdoc
     */
    format(locale: Intl.Locale, value: Date, format: DateTimeFormatOptions): string {
        return new Intl.DateTimeFormat(format?.locale ? format.locale : locale.baseName, format).format(value)
    }
}
