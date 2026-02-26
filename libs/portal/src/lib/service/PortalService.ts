/**
 * This is a generated file, do NOT edit manually!
 * Generator: AxiosClientGenerator V1.0 based on (OpenAPI-Generator https://openapi-generator.tech)
 */

import { AxiosRequestConfig } from 'axios'

import {  AbstractService, HTTPFactory, service } from "@novx/communication"
import {Deployment, DeploymentRequest} from "../model";

/**
 * no description
 */
@service("")
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
