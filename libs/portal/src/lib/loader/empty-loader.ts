import { DeploymentLoader } from '../deployment-manager';
import { Deployment, DeploymentRequest } from "../model"

export class EmptyDeploymentLoader implements DeploymentLoader {
  // implement DeploymentLoader

  load(request: DeploymentRequest): Promise<Deployment> {
    return Promise.resolve({
      modules: {},
    });
  }
}