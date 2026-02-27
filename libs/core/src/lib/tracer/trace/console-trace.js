import { Trace } from "../trace";
import { TraceFormatter } from "../trace-formatter";
/**
 * A <code>ConsoleTrace</code> will emit trace entries to the console.
 */
export class ConsoleTrace extends Trace {
    // constructor
    constructor(messageFormat) {
        super(new TraceFormatter(messageFormat));
    }
    // implement Trace
    /**
     * @inheritDoc
     */
    trace(entry) {
        console.log(this.format(entry));
    }
}
//# sourceMappingURL=console-trace.js.map