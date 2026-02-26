/**
 * This is a generated file, do NOT edit manually!
 * Generator: AxiosClientGenerator V1.0 based on (OpenAPI-Generator https://openapi-generator.tech)
 */

import { ClientInfo, ClientInfoSchema } from './ClientInfo'
import { schema, enumeration, oneOf, string, object, boolean, number, array, record, reference, date } from "@novx/core"



export interface DeploymentRequest {
    application: string
    client: ClientInfo
}


/**
* the schema for {@link DeploymentRequest}
*/
export const DeploymentRequestSchema = schema("DeploymentRequest", object({
   application: string().required(),
   client: reference(ClientInfoSchema).required(),
}))




