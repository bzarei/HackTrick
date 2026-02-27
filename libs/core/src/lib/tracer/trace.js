import { TraceFormatter } from "./trace-formatter";
/**
 * A <code>Trace</code> is used to emit a trace entry.
 */
export class Trace {
    // instance data
    formatter;
    // constructor
    constructor(formatter) {
        this.formatter =
            typeof formatter == "string" ? new TraceFormatter(formatter) : formatter;
    }
    // protected
    /**
     * format a trace entry
     * @param entry the entry
     */
    format(entry) {
        return this.formatter.format(entry);
    }
}
//# sourceMappingURL=trace.js.map