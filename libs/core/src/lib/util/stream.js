class ArrayCollector {
    // instance data
    result = this.create();
    // implement Collector
    create() {
        return [];
    }
    add(element) {
        this.result.push(element);
    }
    finish() {
        return this.result;
    }
}
export class Collectors {
    static toArray() {
        return new ArrayCollector();
    }
}
export class AsyncStream {
    source;
    // static 
    static of(source) {
        return new AsyncSource(source);
    }
    // constructor
    constructor(source) {
        this.source = source;
    }
    // fluent
    filter(predicate) {
        return new AsyncStream(new AsyncFilter(this.source, predicate));
    }
    async collect(collector) {
        for await (const element of this.source)
            collector.add(element);
        return collector.finish();
    }
}
export class AsyncFilter extends AsyncStream {
    predicate;
    // constructor
    constructor(source, predicate) {
        super(source);
        this.predicate = predicate;
    }
    // iterators
    async *[Symbol.asyncIterator]() {
        for await (const element of this.source) {
            if (this.predicate(element))
                yield element;
        }
    }
}
export class Stream {
    source;
    // static 
    static of(source) {
        return new SyncSource(source);
    }
    // constructor
    constructor(source) {
        this.source = source;
    }
    // fluent methods
    reduce(reducer, seed) {
        const iterator = this.source[Symbol.iterator]();
        let accumulated = seed;
        let result = iterator.next();
        while (!result.done) {
            accumulated = reducer(accumulated, result.value);
            result = iterator.next();
        }
        return accumulated;
    }
    min() {
        let min = undefined;
        for (const element of this.source) {
            if (min === undefined)
                min = element;
            else if (element < min)
                min = element;
        } // for
        return min;
    }
    max() {
        let max = undefined;
        for (const element of this.source) {
            if (max === undefined)
                max = element;
            else if (element > max)
                max = element;
        } // for
        return max;
    }
    collect(collector) {
        for (const element of this.source)
            collector.add(element);
        return collector.finish();
    }
    map(selector) {
        return new Stream(new Map(this.source, selector));
    }
    filter(predicate) {
        return new Stream(new Filter(this.source, predicate));
    }
    sort(compare) {
        return new Stream(new Sort(this.source, compare));
    }
    distinct(compare = (v1, v2) => v1 == v2) {
        return new Stream(new Distinct(this.source, compare));
    }
    tap(action) {
        return new Stream(new Tap(this.source, action));
    }
}
// tap
export class Tap extends Stream {
    action;
    // constructor
    constructor(source, action) {
        super(source);
        this.action = action;
    }
    *[Symbol.iterator]() {
        for (const element of this.source) {
            this.action(element);
            yield element;
        }
    }
}
// sort
export class Sort extends Stream {
    compare;
    // constructor
    constructor(source, compare) {
        super(source);
        this.compare = compare;
    }
    *[Symbol.iterator]() {
        const sorted = [];
        for (const element of this.source)
            sorted.push(element);
        sorted.sort(this.compare);
        for (const value of sorted)
            yield value;
    }
}
// filter
export class Filter extends Stream {
    predicate;
    // constructor
    constructor(source, predicate) {
        super(source);
        this.predicate = predicate;
    }
    // iterators
    async *[Symbol.asyncIterator]() {
        for await (const element of this.source) {
            if (this.predicate(element))
                yield element;
        }
    }
    *[Symbol.iterator]() {
        for (const element of this.source) {
            if (this.predicate(element)) {
                yield element;
            }
        }
    }
}
// distinct
export class Distinct extends Stream {
    compare;
    // constructor
    constructor(source, compare) {
        super(source);
        this.compare = compare;
    }
    *[Symbol.iterator]() {
        const unique = [];
        for (const element of this.source) {
            let isNew = true;
            for (const v of unique)
                if (this.compare(element, v)) {
                    isNew = false;
                    break;
                }
            if (isNew) {
                unique.push(element);
                yield element;
            }
        } // for
    }
}
// map 
export class Map extends Stream {
    selector;
    // constructor
    constructor(source, selector) {
        super(source);
        this.selector = selector;
    }
    // implement IterableIterator<R>
    *[Symbol.iterator]() {
        let index = 0;
        for (const element of this.source) {
            yield this.selector(element, index++);
        }
    }
}
// from
export class SyncSource extends Stream {
    // constructor
    constructor(source) {
        super(source);
    }
    // implement Iterable
    *[Symbol.iterator]() {
        yield* this.source;
    }
}
export class AsyncSource extends AsyncStream {
    // constructor
    constructor(source) {
        super(source);
    }
    // iterator
    async *[Symbol.asyncIterator]() {
        yield* this.source;
    }
}
//# sourceMappingURL=stream.js.map