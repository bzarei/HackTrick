import { TraceEntry } from "./trace-entry";
/**
 * @ignore
 */
export declare class TraceFormatter {
    private readonly renderer;
    constructor(format: string);
    private level;
    private scan;
    private parse;
    private build;
    format(entry: TraceEntry): string;
}
//# sourceMappingURL=trace-formatter.d.ts.map