import { injectable } from "@novx/core"
import { FormatOptions, ValueFormatter } from "./ValueFormatter"

import { LocaleManager } from "../locale"

/**
 * The <code>FormatterRegistry</code> is the registry for known formatters and the main api for formatting requests.
 */
@injectable()
export class FormatterRegistry {
    // instance data

    static registry: { [type: string]: ValueFormatter<any, any> } = {}

    // constructor

    constructor(private localeManager: LocaleManager) {}

    // public

    /**
     * format a given value.
     * @param type the formatter name
     * @param value the value
     * @param options formatter options
     */
    format(type: string, value: any, options: FormatOptions): string {
        const formatter = FormatterRegistry.registry[type]

        if (formatter)
            return formatter.format(this.localeManager.getLocale(), value, options)
        else
            throw new Error(`unknown formatter "${type}"`)
    }

    /**
     * register a specific formatter
     * @param type the formatter name
     * @param formatter the formatter
     */
    static register(type: string, formatter: ValueFormatter<any, any>) {
        this.registry[type] = formatter
    }
}

import "./formatter"

