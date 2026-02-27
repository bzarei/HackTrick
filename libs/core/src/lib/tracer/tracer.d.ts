import { TraceLevel } from "./trace-level";
import type { TracerConfiguration } from "./tracer-configuration";
import { StackFrame } from "../util";
/**
 * A Tracer is used to emit trace messages for development purposes.
 * While it shares the logic of a typical logger, it will be turned of in production.
 */
export declare class Tracer {
    static ENABLED: boolean;
    private static This;
    static getSingleton(): Tracer;
    static Trace(path: string, level: TraceLevel, message: string, ...args: any[]): Promise<void>;
    private traceLevels;
    private cachedTraceLevels;
    private modifications;
    private sink;
    constructor(tracerConfiguration: TracerConfiguration);
    isTraced(path: string, level: TraceLevel): boolean;
    trace(path: string, level: TraceLevel, message: string, frame: StackFrame, ...args: any[]): Promise<void>;
    private getTraceLevel;
    private setTraceLevel;
}
//# sourceMappingURL=tracer.d.ts.map