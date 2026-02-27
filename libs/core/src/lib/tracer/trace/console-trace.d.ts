import { Trace } from "../trace";
import { TraceEntry } from "../trace-entry";
/**
 * A <code>ConsoleTrace</code> will emit trace entries to the console.
 */
export declare class ConsoleTrace extends Trace {
    constructor(messageFormat: string);
    /**
     * @inheritDoc
     */
    trace(entry: TraceEntry): void;
}
//# sourceMappingURL=console-trace.d.ts.map