export interface Collector<S, R> {
    create(): R;
    add(element: S): void;
    finish(): R;
}
export declare class Collectors {
    static toArray<S>(): Collector<S, S[]>;
}
export declare class AsyncStream<S> {
    protected source: AsyncIterable<S>;
    static of<S>(source: AsyncIterable<S>): AsyncSource<S>;
    protected constructor(source: AsyncIterable<S>);
    filter(predicate: (element: S) => boolean): AsyncStream<S>;
    collect<R>(collector: Collector<S, R>): Promise<R>;
}
export declare class AsyncFilter<S> extends AsyncStream<S> {
    private predicate;
    constructor(source: AsyncIterable<S>, predicate: (element: S) => boolean | Promise<boolean>);
    [Symbol.asyncIterator](): AsyncIterableIterator<S>;
}
export declare class Stream<S> {
    protected source: Iterable<S>;
    static of<S>(source: Iterable<S>): SyncSource<S>;
    protected constructor(source: Iterable<S>);
    reduce<R>(reducer: (accumulated: R, element: S) => R, seed: R): R;
    min(): S | undefined;
    max(): S | undefined;
    collect<R>(collector: Collector<S, R>): R;
    map<R>(selector: (element: S, index: number) => R): Stream<R>;
    filter(predicate: (element: S) => boolean): Stream<S>;
    sort(compare?: (v1: S, v2: S) => number): Stream<S>;
    distinct(compare?: (v1: S, v2: S) => boolean): Stream<S>;
    tap(action: (element: S) => void): Stream<S>;
}
export declare class Tap<S> extends Stream<S> {
    private action;
    constructor(source: Iterable<S>, action: (element: S) => void);
    [Symbol.iterator](): IterableIterator<S>;
}
export declare class Sort<S> extends Stream<S> {
    private compare?;
    constructor(source: Iterable<S>, compare?: ((v1: S, v2: S) => number) | undefined);
    [Symbol.iterator](): IterableIterator<S>;
}
export declare class Filter<S> extends Stream<S> {
    private predicate;
    constructor(source: Iterable<S>, predicate: (element: S) => boolean | Promise<boolean>);
    [Symbol.asyncIterator](): AsyncIterableIterator<S>;
    [Symbol.iterator](): IterableIterator<S>;
}
export declare class Distinct<S> extends Stream<S> {
    private compare;
    constructor(source: Iterable<S>, compare: (v1: S, v2: S) => boolean);
    [Symbol.iterator](): IterableIterator<S>;
}
export declare class Map<S, R> extends Stream<S> {
    private selector;
    constructor(source: Iterable<S>, selector: (element: S, index: number) => R);
    [Symbol.iterator](): IterableIterator<R>;
}
export declare class SyncSource<S> extends Stream<S> implements Iterable<S> {
    constructor(source: Iterable<S>);
    [Symbol.iterator](): IterableIterator<S>;
}
export declare class AsyncSource<S> extends AsyncStream<S> {
    constructor(source: AsyncIterable<S>);
    [Symbol.asyncIterator](): AsyncIterableIterator<S>;
}
//# sourceMappingURL=stream.d.ts.map