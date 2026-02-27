import { AnnotationResolver, Environment } from "./di";
export declare class ConfigValue {
    readonly key: string;
    readonly default_: any;
    constructor(key: string, default_?: any);
    toString(): string;
}
export declare function config(key: string, defaultValue?: any): ParameterDecorator;
export declare class ConfigAnnotationResolver extends AnnotationResolver<any> {
    constructor();
    private coerce;
    dependencies(): any[];
    resolve(annotationValue: ConfigValue, paramType: any, environment: Environment, ...deps: any[]): any;
}
//# sourceMappingURL=configuration_di.d.ts.map