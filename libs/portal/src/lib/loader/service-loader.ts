import { DeploymentLoader } from '../deployment-manager';
import { Deployment, DeploymentRequest } from "../model"
import { PortalService } from '../service/PortalService';


export class ServiceDeploymentLoader implements DeploymentLoader {
 
  // constructor

  constructor(private portalService: PortalService) {
  }

  // implement DeploymentLoader

  async load(request: DeploymentRequest): Promise<Deployment> {
    return await this.portalService.computeDeployment(request);
  }
}