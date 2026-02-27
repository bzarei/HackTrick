import { StringBuilder } from "../util";
import { TraceLevel } from "./trace-level";
/**
 * @ignore
 */
export class TraceFormatter {
    // instance data
    renderer;
    // constructor
    constructor(format) {
        this.renderer = this.parse(format);
    }
    // private
    level(level) {
        switch (level) {
            case TraceLevel.OFF:
                return "OFF";
            case TraceLevel.LOW:
                return "LOW";
            case TraceLevel.MEDIUM:
                return "MEDIUM";
            case TraceLevel.HIGH:
                return "HIGH";
            case TraceLevel.FULL:
                return "FULL";
        }
    }
    scan(format, callbacks) {
        // go
        let start = 0;
        let i;
        while ((i = format.indexOf("%", start)) >= 0) {
            // rest from last run?
            if (i > start)
                callbacks.string(format.substring(start, i));
            // take care of placeholder
            callbacks[format[++i]]();
            // next
            start = ++i;
        } // while
        // last element
        if (start < format.length)
            callbacks.string(format.substring(start));
    }
    parse(format) {
        const result = []; // array of strings or functions
        this.scan(format, {
            // string literal
            string: (value) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                result.push((builder, model) => builder.append(value));
            },
            // placeholders
            d: () => {
                // date
                result.push((builder, model) => builder.append(model.d));
            },
            l: () => {
                // level
                result.push((builder, model) => builder.append(model.l));
            },
            p: () => {
                // path
                result.push((builder, model) => builder.append(model.p));
            },
            m: () => {
                // message
                result.push((builder, model) => builder.append(model.m));
            },
            f: () => {
                // message
                result.push((builder, model) => builder.append((model.f.file || "<unknown>") + ":" + model.f.lineNumber + ":" + model.f.column));
            },
        });
        return result;
    }
    // '%d [%l] %p: %m', // d(ate), l(evel), p(ath), m(message)
    build(args) {
        const builder = new StringBuilder();
        for (const render of this.renderer)
            render(builder, args);
        return builder.toString();
    }
    format(entry) {
        return this.build({
            p: entry.path,
            d: entry.timestamp.toDateString(),
            l: this.level(entry.level),
            m: entry.message,
            f: entry.stackFrame,
        });
    }
}
//# sourceMappingURL=trace-formatter.js.map