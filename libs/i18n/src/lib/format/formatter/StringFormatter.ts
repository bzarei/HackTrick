import { FormatOptions, ValueFormatter } from "../ValueFormatter"
import { formatter } from "../registerFormatter.decorator"

// nothing so far...
type StringFormatOptions = FormatOptions

/**
 * formatter for strings
 */
@formatter("string")
export class StringFormatter implements ValueFormatter<string, StringFormatOptions> {
    // implement ValueFormatter

    /**
     * @inheritdoc
     */
    format(locale: Intl.Locale, value: string, format: StringFormatOptions): string {
        return value
    }
}
