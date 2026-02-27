/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { catchError, forkJoin, lastValueFrom, map, of, shareReplay, switchMap, tap } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';
import { SourceMapConsumer } from 'source-map-js';
/* eslint-disable @typescript-eslint/no-non-null-assertion */
const UNKNOWN_FUNCTION = '<unknown>';
class ChromeParser {
    // instance data
    chromeRe = /^\s*at (.*?) ?\(((?:file|https?|blob|chrome-extension|native|eval|webpack|<anonymous>|\/|[a-z]:\\|\\\\).*?)(?::(\d+))?(?::(\d+))?\)?\s*$/i;
    chromeEvalRe = /\((\S*)(?::(\d+))(?::(\d+))\)/;
    // implement Parser
    parse(line) {
        const parts = this.chromeRe.exec(line);
        if (!parts)
            return null;
        const isNative = parts[2] && parts[2].indexOf('native') === 0; // start of line
        const isEval = parts[2] && parts[2].indexOf('eval') === 0; // start of line
        const submatch = this.chromeEvalRe.exec(parts[2]);
        if (isEval && submatch != null) {
            // throw out eval line/column and use top-most line/column number
            parts[2] = submatch[1]; // url
            parts[3] = submatch[2]; // line
            parts[4] = submatch[3]; // column
        }
        return {
            file: !isNative ? parts[2] : null,
            methodName: parts[1] || UNKNOWN_FUNCTION,
            arguments: isNative ? [parts[2]] : [],
            lineNumber: parts[3] ? +parts[3] : null,
            column: parts[4] ? +parts[4] : null,
        };
    }
}
class GeckoParser {
    // instance data
    geckoRe = /^\s*(.*?)(?:\((.*?)\))?(?:^|@)((?:file|https?|blob|chrome|webpack|resource|\[native).*?|[^@]*bundle)(?::(\d+))?(?::(\d+))?\s*$/i;
    geckoEvalRe = /(\S+) line (\d+)(?: > eval line \d+)* > eval/i;
    // implement Parser
    parse(line) {
        const parts = this.geckoRe.exec(line);
        if (!parts)
            return null;
        const isEval = parts[3] && parts[3].indexOf(' > eval') > -1;
        const submatch = this.geckoEvalRe.exec(parts[3]);
        if (isEval && submatch != null) {
            // throw out eval line/column and use top-most line number
            parts[3] = submatch[1];
            parts[4] = submatch[2];
            parts[5] = ""; //null; // no column when eval
        }
        return {
            file: parts[3],
            methodName: parts[1] || UNKNOWN_FUNCTION,
            arguments: parts[2] ? parts[2].split(',') : [],
            lineNumber: parts[4] ? +parts[4] : null,
            column: parts[5] ? +parts[5] : null,
        };
    }
}
function determineParser() {
    // Check if running in Node.js environment
    if (typeof navigator === 'undefined' || typeof process !== 'undefined' && process.versions && process.versions.node) {
        // Node uses V8, same stack format as Chrome
        return new ChromeParser();
    }
    if (navigator.userAgent.toLowerCase().indexOf('chrome') > -1)
        return new ChromeParser();
    else if (navigator.userAgent.toLowerCase().indexOf('gecko') > -1)
        return new GeckoParser();
    else {
        console.log("## unable to parse stracktraces, agent is " + navigator.userAgent);
        return {
            parse(line) {
                return null;
            }
        };
    }
}
export class Stacktrace {
    // static data
    static loading = {};
    static consumer = {};
    static parser = determineParser();
    // public
    static async mapFrames(...frames) {
        const isNode = typeof window === 'undefined';
        if (isNode) {
            for (const frame of frames) {
                if (!frame.file)
                    continue;
                if (!this.consumer[frame.file]) {
                    await this.loadSourcemapNode(frame.file);
                }
                if (this.consumer[frame.file] && frame.lineNumber) {
                    const pos = this.consumer[frame.file].originalPositionFor({
                        line: frame.lineNumber,
                        column: frame.column,
                    });
                    frame.file = pos.source;
                    frame.lineNumber = pos.line;
                    frame.column = pos.column;
                }
            }
            return frames;
        }
        const files = {};
        for (const frame of frames)
            if (frame.file && frame.file.includes(":"))
                files[frame.file] = true;
        // load missing source maps
        const missingFiles = Object.keys(files).filter(file => this.consumer[file] == undefined);
        if (missingFiles.length > 0) {
            //console.log("load missing source maps ", missingFiles)
            await lastValueFrom(forkJoin(missingFiles.map(file => this.loadSourcemap(file))));
        }
        // map
        for (const stackFrame of frames) {
            if (stackFrame.lineNumber && stackFrame.file && stackFrame.file.includes(":")) {
                const originalPosition = this.consumer[stackFrame.file].originalPositionFor({
                    line: stackFrame.lineNumber,
                    column: stackFrame.column,
                });
                stackFrame.file = originalPosition.source;
                stackFrame.lineNumber = originalPosition.line;
                stackFrame.column = originalPosition.column;
            }
        }
        // done
        return frames;
    }
    static createFrames(stack) {
        return stack.split('\n').reduce((stack, line) => {
            const frame = this.parser.parse(line);
            if (frame)
                stack.push(frame);
            return stack;
        }, []);
    }
    // private
    static async loadSourcemapNode(filePath) {
        try {
            const fs = await import('fs');
            const content = fs.readFileSync(filePath, 'utf-8');
            // inline source map
            const inlineMatch = RegExp(/\/\/# sourceMappingURL=data:application\/json;base64,(.*)/).exec(content);
            if (inlineMatch) {
                const mapContent = JSON.parse(Buffer.from(inlineMatch[1], 'base64').toString());
                this.consumer[filePath] = new SourceMapConsumer(mapContent);
                return;
            }
            // external source map file
            const fileMatch = RegExp(/\/\/# sourceMappingURL=(.*)/).exec(content);
            if (fileMatch) {
                const path = await import('path');
                const mapPath = path.resolve(path.dirname(filePath), fileMatch[1]);
                const mapContent = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
                this.consumer[filePath] = new SourceMapConsumer(mapContent);
            }
        }
        catch (e) {
            // file not readable or no source map
        }
    }
    static loadSourcemap(uri) {
        const uriQuery = new URL(uri).search;
        const loading = this.loading[uri];
        console.log("### find source map for " + uri);
        if (loading)
            return loading;
        else {
            const request = fromFetch(uri).pipe(catchError((e) => {
                console.error("### OUCH ", e);
                return of();
            }), switchMap(response => response.text()), switchMap(script => {
                const match = RegExp(/\/\/# sourceMappingURL=(.*)/).exec(script);
                let mapUri = match !== null ? match[1] : "";
                console.log(mapUri);
                mapUri = new URL(mapUri, uri).href + uriQuery;
                return fromFetch(mapUri);
            }), switchMap(sourceMap => sourceMap.json()), map(sourceMap => new SourceMapConsumer(sourceMap)), tap(consumer => this.consumer[uri] = consumer), shareReplay());
            return this.loading[uri] = request;
        }
    }
}
//# sourceMappingURL=stacktrace.js.map