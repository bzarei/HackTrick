import { TraceLevel } from "./trace-level";
import { StackFrame } from "../util/stacktrace";
/**
 * A <code>TraceEntry</code> is the internal representation of a trace entry.
 */
export declare class TraceEntry {
    /**
     * the path
     */
    path: string;
    /**
     * the level
     */
    level: TraceLevel;
    /**
     * the formatted message
     */
    message: string;
    /**
     * the timestamp
     */
    timestamp: Date;
    stackFrame: StackFrame;
    constructor(path: string, level: TraceLevel, message: string, timestamp: Date, stackFrame: StackFrame);
}
//# sourceMappingURL=trace-entry.d.ts.map