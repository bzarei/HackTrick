/**
 * This is a generated file, do NOT edit manually!
 * Generator: AxiosClientGenerator V1.0 based on (OpenAPI-Generator https://openapi-generator.tech)
 */


import { schema, enumeration, oneOf, string, object, boolean, number, array, record, reference, date } from "@novx/core"



export interface ClientConstraints {
    screenSizes?: Array<string> | null
    orientation?: Array<string> | null
    platforms?: Array<string> | null
    minWidth?: number | null
    maxWidth?: number | null
    minHeight?: number | null
    maxHeight?: number | null
    capabilities?: Array<string> | null
}


/**
* the schema for {@link ClientConstraints}
*/
export const ClientConstraintsSchema = schema("ClientConstraints", object({
   screenSizes: array(string()).optional().nullable(),
   orientation: array(string()).optional().nullable(),
   platforms: array(string()).optional().nullable(),
   minWidth: number().optional().nullable(),
   maxWidth: number().optional().nullable(),
   minHeight: number().optional().nullable(),
   maxHeight: number().optional().nullable(),
   capabilities: array(string()).optional().nullable(),
}))




