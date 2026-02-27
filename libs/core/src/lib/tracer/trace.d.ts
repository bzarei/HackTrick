import { TraceFormatter } from "./trace-formatter";
import { TraceEntry } from "./trace-entry";
/**
 * A <code>Trace</code> is used to emit a trace entry.
 */
export declare abstract class Trace {
    private formatter;
    protected constructor(formatter: TraceFormatter | string);
    /**
     * format a trace entry
     * @param entry the entry
     */
    protected format(entry: TraceEntry): string;
    abstract trace(entry: TraceEntry): void;
}
//# sourceMappingURL=trace.d.ts.map