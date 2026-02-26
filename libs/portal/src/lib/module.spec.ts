import "reflect-metadata"

import { AbstractModule, Module } from "./module";

@Module({
  id: 'base',
  version: '1.0.0',
})
export class BaseModule extends AbstractModule {
    // override

    async setup() {
        console.log("BaseModule setup")
    }
}

@Module({
  //imports: [BaseModule],
  id: 'api',
  version: '1.0.0',
})
export class ApiModule extends AbstractModule {
  // override

  async setup() {
    console.log('ApiModule setup');
  }
}

// load

describe("module", () => {

    it("should boot", () => {
        //AbstractModule.processAll(undefined);
    })
})