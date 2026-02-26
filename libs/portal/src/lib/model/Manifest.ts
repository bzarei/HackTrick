/**
 * This is a generated file, do NOT edit manually!
 * Generator: AxiosClientGenerator V1.0 based on (OpenAPI-Generator https://openapi-generator.tech)
 */

import { FeatureDescriptor, FeatureDescriptorSchema } from './FeatureDescriptor'
import { schema, enumeration, oneOf, string, object, boolean, number, array, record, reference, date } from "@novx/core"



export interface Manifest {
  id?: string;
  loaded?: boolean;
  enabled?: boolean;
  label?: string;
  description?: string;
  version?: string;
  uri?: string; // TODO?
  module?: string; // TODO ?
  features: Array<FeatureDescriptor>;
}


/**
* the schema for {@link Manifest}
*/
export const ManifestSchema = schema(
  'Manifest',
  object({
    id: string().optional(),
    enabled: boolean().optional(),
    loaded: boolean().optional(),
    label: string().optional(),
    description: string().optional(),
    name: string().optional(),
    uri: string().optional(),
    module: string().optional(),
    features: array(FeatureDescriptorSchema).required(),
  }),
);




