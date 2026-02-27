import { boolean, array, date, number, string, ArrayType, RecordType, record, Type, double, float, integer, long } from "./type";
//  mapping of generated keywords to fluent methods
const typeMap = {
    // does that work?
    ref: {},
    number: {
        format: {
            call: (constraint, format) => {
                return constraint;
            },
            argument: "string"
        },
        nullable: { call: "optional" },
        min: { call: "min", argument: "number" },
        max: { call: "max", argument: "number" },
        "<": { call: "lessThan", argument: "number" },
        "<=": { call: "lessThanEquals", argument: "number" },
        ">": { call: "greaterThan", argument: "number" },
        ">=": { call: "greaterThanEquals", argument: "number" },
    },
    string: {
        nullable: { call: "optional" },
        format: {
            call: (constraint, format) => {
                if (format === "email")
                    return constraint.email();
                else
                    return constraint;
            },
            argument: "string",
        },
        "non-empty": { call: "nonEmpty" },
        "min-length": { call: "min", argument: "number" },
        "max-length": { call: "max", argument: "number" },
        pattern: { call: "matches", argument: "re" },
    },
    boolean: {
        nullable: { call: "optional" },
        "is-true": { call: "isTrue" },
        "is-false": { call: "isFalse" },
    },
    date: {
        format: {
            call: (constraint, format) => {
                return constraint;
            },
        },
        nullable: { call: "optional" },
        min: { call: "min", argument: "number" },
        max: { call: "max", argument: "number" },
        // "required": {},}
    },
    array: {
        format: {
            call: (constraint, format) => {
                return constraint;
            },
        },
        nullable: { call: "optional" },
        min: { call: "min", argument: "number" },
        max: { call: "max", argument: "number" },
    },
    record: {
        format: {
            call: (constraint, format) => {
                return constraint;
            },
        },
        nullable: { call: "optional" },
        // "required": {},
    },
};
typeMap["short"] = typeMap["number"];
typeMap["integer"] = typeMap["number"];
typeMap["long"] = typeMap["number"];
typeMap["float"] = typeMap["number"];
typeMap["double"] = typeMap["number"];
export class TypeParser {
    // static methods
    static normalizeType(type) {
        if (type.startsWith("Array<"))
            return "array";
        else if (type.startsWith("ref:"))
            return "ref";
        else
            return type;
    }
    static supportsConstraint(type, keyword) {
        type = TypeParser.normalizeType(type);
        if (typeMap[type])
            return typeMap[type][keyword] !== undefined;
        else
            return false;
    }
    static supportedConstraints(type) {
        type = TypeParser.normalizeType(type);
        return typeMap[type] ? Object.keys(typeMap[type]) : [];
    }
    static constraintArguments(type, constraint) {
        type = TypeParser.normalizeType(type);
        const argument = typeMap[type][constraint].argument;
        return argument ? [argument] : [];
    }
    // methods
    static parseConstraint(type, constraint, input) {
        // local functions
        const parseArgument = (type, input) => {
            if (type == "string")
                return [input];
            if (type == "number") {
                if (/^-?\d+\.?\d*$/.test(input))
                    return [parseInt(input)];
                else
                    throw new Error(`expected a number`);
            }
            if (type == "boolean")
                return [input === "true"];
            if (type == "re")
                return [new RegExp(input)];
            throw new Error(`unsupported type ${type}`);
        };
        const tokenize = (input) => {
            // local function
            const isWS = (c) => {
                return (c <= 32 && c >= 0) || c == 127;
            };
            const result = [];
            let wasWS = true;
            let start = 0;
            let i;
            let inString = false;
            for (i = 0; i < input.length; i++) {
                const c = input[i];
                if (c === '"') {
                    if (inString) {
                        if (i - start > 0)
                            result.push(input.substring(start + 1, i));
                    }
                    else {
                        inString = true;
                        start = i;
                    }
                }
                else if (!inString) {
                    const ws = isWS(input.charCodeAt(i));
                    if (ws != wasWS) {
                        if (ws) {
                            if (i - start > 0)
                                result.push(input.substring(start, i));
                        }
                        else
                            start = i;
                        // next
                        wasWS = ws;
                    } // if
                }
            } // for
            if (!wasWS && i - start > 0)
                result.push(input.substring(start, i));
            return result;
        };
        const supportedKeywords = typeMap[type];
        // parse
        const tokens = tokenize(input); //.match(/\S+/g); // check for % 2 === 0
        if (tokens.length > 0) {
            let index = 0;
            do {
                const key = tokens[index++];
                const keyword = supportedKeywords[key];
                if (keyword) {
                    if (keyword.argument) {
                        const token = tokens[index++];
                        if (!token)
                            throw new Error(`type ${type} expected an ${key} argument of type ${keyword.argument}`);
                        try {
                            if (typeof keyword.call == "string")
                                constraint = constraint[keyword.call](...parseArgument(keyword.argument, token));
                            else
                                constraint = keyword.call.apply(this, [
                                    constraint,
                                    ...parseArgument(keyword.argument, token),
                                ]);
                        }
                        catch (e) {
                            throw new Error(`type ${type} expected an ${key} argument of type ${keyword.argument}`);
                        }
                    }
                    else {
                        if (typeof keyword.call == "string")
                            constraint = constraint[keyword.call]();
                        else
                            constraint = keyword.call.apply(this, [constraint]);
                    }
                }
                else
                    throw new Error(`type ${type} does not support the keywords ${key}`);
            } while (index < tokens.length);
        }
    }
    // public
    static constraint4(type) {
        // literal type
        if (type == "string")
            return string();
        if (type == "number")
            return number();
        if (type == "short")
            return number();
        if (type == "integer")
            return integer();
        if (type == "long")
            return long();
        if (type == "float")
            return float();
        if (type == "double")
            return double();
        if (type == "date")
            return date();
        if (type == "boolean")
            return boolean();
        // array type
        if (type.startsWith("Array<")) {
            const elementType = type.substring(6, type.length - 1);
            return array(Type.get(elementType));
        }
        // map?
        if (type.startsWith("{ [key: string]")) {
            const elementType = type.substring(17, type.length - 3);
            return record(Type.get(elementType));
        }
        // maybe it is a known schema
        return Type.get(type);
    }
    static parse(type, constraintSpec) {
        // create base constraint class
        const constraint = this.constraint4(type);
        if (constraint instanceof ArrayType)
            type = "array";
        else if (constraint instanceof RecordType)
            type = "record";
        // and add checks
        if (constraintSpec)
            this.parseConstraint(type, constraint, constraintSpec);
        // done
        return constraint;
    }
}
export const ptype = (type) => {
    const lowLevelType = type.split(" ")[0];
    type = type.substring(lowLevelType.length + 1);
    return TypeParser.parse(lowLevelType, type);
};
//# sourceMappingURL=type-parser.js.map