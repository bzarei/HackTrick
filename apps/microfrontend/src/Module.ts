import { AbstractModule, DeploymentManager, Module } from '@novx/portal';

const context = import.meta.webpackContext(
  './',
  { 
    recursive: true, 
    regExp: /\.tsx$/ 
  }
);

@Module({
  id: "microfrontend",
  label: "microfrontend module",
  version: "1.0.0",
  description: "Micro Frontend Module",
})
export class MicrofrontendModule extends AbstractModule {
    // override

    async setup(): Promise<void> {
      await super.setup()

      this.environment.get(DeploymentManager).checkLazyFeatures(this.getModuleName(), context);
    }
}

