/**
 * A <code>TraceEntry</code> is the internal representation of a trace entry.
 */
export class TraceEntry {
    /**
     * the path
     */
    path;
    /**
     * the level
     */
    level;
    /**
     * the formatted message
     */
    message;
    /**
     * the timestamp
     */
    timestamp = new Date();
    stackFrame;
    // constructor
    constructor(path, level, message, timestamp, stackFrame) {
        this.path = path;
        this.level = level;
        this.message = message;
        this.timestamp = timestamp;
        this.stackFrame = stackFrame;
    }
}
//# sourceMappingURL=trace-entry.js.map