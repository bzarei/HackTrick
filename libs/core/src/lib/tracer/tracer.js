import { TraceLevel } from "./trace-level";
import { TraceEntry } from "./trace-entry";
import { ConsoleTrace } from "./trace/console-trace";
import { Stacktrace } from "../util";
/**
 * A Tracer is used to emit trace messages for development purposes.
 * While it shares the logic of a typical logger, it will be turned of in production.
 */
export class Tracer {
    // static
    static ENABLED = true;
    static This;
    static getSingleton() {
        if (!Tracer.This)
            new Tracer({
                enabled: true,
                trace: new ConsoleTrace("%d [%p]: %m\n"),
                paths: {
                    "": TraceLevel.FULL,
                },
            });
        return Tracer.This;
    }
    static async Trace(path, level, message, ...args) {
        const instance = Tracer.getSingleton();
        if (instance.getTraceLevel(path) >= level) {
            const stack = new Error().stack;
            const frames = Stacktrace.createFrames(stack);
            const lastFrame = frames[1];
            await instance.trace(path, level, message, lastFrame, ...args).catch(console.error);
        }
    }
    // instance data
    traceLevels = {};
    cachedTraceLevels = {};
    modifications = 0;
    sink;
    constructor(tracerConfiguration) {
        if (tracerConfiguration) {
            // enabled
            Tracer.ENABLED = tracerConfiguration.enabled;
            // some more
            this.sink = tracerConfiguration.trace;
            // set paths
            for (const path of Object.keys(tracerConfiguration.paths)) {
                this.setTraceLevel(path, tracerConfiguration.paths[path]);
            }
        }
        Tracer.This = this;
    }
    // public
    isTraced(path, level) {
        return this.getTraceLevel(path) >= level;
    }
    async trace(path, level, message, frame, ...args) {
        if (Tracer.ENABLED && this.getTraceLevel(path) >= level) {
            // new TODO
            //await Stacktrace.mapFrames(frame);
            // format
            const formattedMessage = message.replace(/{(\d+)}/g, function (match, number) {
                let value = args[+number];
                if (value === undefined)
                    value = "undefined";
                else if (value === null)
                    value = "null";
                return value;
            });
            // and write
            this.sink?.trace(new TraceEntry(path, level, formattedMessage, new Date(), frame));
        }
    }
    // private
    getTraceLevel(path) {
        // check dirty state
        if (this.modifications > 0) {
            this.cachedTraceLevels = {}; // restart from scratch
            this.modifications = 0;
        } // if
        let level = this.cachedTraceLevels[path];
        if (!level) {
            level = this.traceLevels[path];
            if (!level) {
                const index = path.lastIndexOf(".");
                level = index != -1 ? this.getTraceLevel(path.substring(0, index)) : TraceLevel.OFF;
            } // if
            // cache
            this.cachedTraceLevels[path] = level;
        } // if
        return level;
    }
    setTraceLevel(path, level) {
        this.traceLevels[path] = level;
        this.modifications++;
    }
}
//# sourceMappingURL=tracer.js.map