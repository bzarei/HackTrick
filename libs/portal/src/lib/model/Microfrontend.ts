/**
 * This is a generated file, do NOT edit manually!
 * Generator: AxiosClientGenerator V1.0 based on (OpenAPI-Generator https://openapi-generator.tech)
 */

import { schema, enumeration, oneOf, string, object, boolean, number, array, record, reference, date } from "@novx/core"



export interface Microfrontend {
    id: string
    versionId: number
    name: string
    uri: string
    enabled: boolean
    configuration: string
}


/**
* the schema for {@link Microfrontend}
*/
export const MicrofrontendSchema = schema("Microfrontend", object({
   id: string().format("uuid").required(),
   versionId: number().required(),
   name: string().required(),
   uri: string().required(),
   enabled: boolean().required(),
   configuration: string().required(),
}))




