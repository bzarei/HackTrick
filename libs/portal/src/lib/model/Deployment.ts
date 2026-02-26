/**
 * This is a generated file, do NOT edit manually!
 * Generator: AxiosClientGenerator V1.0 based on (OpenAPI-Generator https://openapi-generator.tech)
 */

import { Manifest, ManifestSchema } from './Manifest'
import { schema, enumeration, oneOf, string, object, boolean, number, array, record, reference, date } from "@novx/core"



export interface Deployment {
    modules: { [key: string]: Manifest; }
}


/**
* the schema for {@link Deployment}
*/
export const DeploymentSchema = schema("Deployment", object({
   modules: record(ManifestSchema).required(),
}))




