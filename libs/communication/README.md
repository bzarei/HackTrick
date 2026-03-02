# Communication

## Introduction

The `communication` library implements base classes for services based on axios.
The main challenge is to integrate schema infromation on the respective obejcts that will be transmitted,
in order to serialize values properyl ( think of date values ) and to validate them.

**Example**: A `OpenAPI` generated service class 

```ts

import { AxiosRequestConfig } from 'axios'

import { AbstractService, HTTPFactory, service } from "@novx/communication"
import {Deployment, DeploymentRequest} from "../model";

/**
 * no description
 */
@service("portal")
export class PortalService extends AbstractService {
    // constructor

    constructor(factory: HTTPFactory) {
        super(factory)
    }

    // public

    /**
     * Portal-Component.Portal-Service.Compute Deployment
     * @param requestBody 
     */
    public async computeDeployment(requestBody:DeploymentRequest): Promise<Deployment> {
      // create request config

      const requestContext: AxiosRequestConfig = {
        url: '/portal/deployment',
        method: 'POST',
        data: this.serialize('DeploymentRequest', '', requestBody),
      };

      // execute query

      const response = await this.request(requestContext);

      return this.deserialize<Deployment>('Deployment', '', response.data);
    }
}
```

The serialization relies on schema  information that is part of the generated classes:

```ts
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
```
## API Docs

- http://ernstandreas.de/novx/