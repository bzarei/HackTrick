export class ValidationError extends Error {
    violations;
    constructor(violations) {
        super("validation error");
        this.violations = violations;
    }
}
//# sourceMappingURL=validation-error.js.map