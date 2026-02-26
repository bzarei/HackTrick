import { DeploymentLoader } from '../deployment-manager';
import { Deployment, DeploymentRequest, Manifest } from '../model';

export interface RemoteManifestUrl {
  name: string;
  url: string;
}

export class RemoteDeploymentLoader implements DeploymentLoader {
  // instance data

  private remoteUrls: RemoteManifestUrl[];

  // constructor

  constructor(remoteUrls: RemoteManifestUrl[]) {
    this.remoteUrls = remoteUrls;
  }

  // implement DeploymentLoader

  async load(request: DeploymentRequest): Promise<Deployment> {
    const modules: Record<string, Manifest> = {};

    // Fetch all manifests in parallel
    const manifestPromises = this.remoteUrls.map(async (remote) => {
      try {
        const response = await fetch(`${remote.url}/manifest.json`);
        if (!response.ok) {
          console.error(
            `Failed to fetch manifest from ${remote.url}: ${response.statusText}`,
          );
          return null;
        }

        const manifest: Manifest = await response.json();

        // Set the module name and URI
        manifest.id = remote.name;
        manifest.uri = remote.url;
        manifest.module = remote.name;

        return { name: remote.name, manifest };
      } catch (error) {
        console.error(`Error fetching manifest from ${remote.url}:`, error);
        return null;
      }
    });

    // Wait for all fetches to complete
    const results = await Promise.all(manifestPromises);

    // Add successfully fetched manifests to modules
    for (const result of results) {
      if (result) {
        modules[result.name] = result.manifest;
      }
    }

    return {
      modules,
    };
  }
}
