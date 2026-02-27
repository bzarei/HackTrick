import { Observable } from 'rxjs';
import { SourceMapConsumer } from 'source-map-js';
export interface StackFrame {
    file: string | null;
    methodName: string | null;
    arguments: any[] | null;
    lineNumber: number | null;
    column: number | null;
}
interface Parser {
    parse(line: string): StackFrame | null;
}
export declare class Stacktrace {
    static loading: {
        [key: string]: Observable<SourceMapConsumer>;
    };
    static consumer: {
        [file: string]: SourceMapConsumer;
    };
    static parser: Parser;
    static mapFrames(...frames: StackFrame[]): Promise<StackFrame[]>;
    static createFrames(stack: string): StackFrame[];
    private static loadSourcemapNode;
    private static loadSourcemap;
}
export {};
//# sourceMappingURL=stacktrace.d.ts.map