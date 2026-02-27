import { TypeViolation } from "./type-violation";
export declare class ValidationError extends Error {
    violations: TypeViolation[];
    constructor(violations: TypeViolation[]);
}
//# sourceMappingURL=validation-error.d.ts.map