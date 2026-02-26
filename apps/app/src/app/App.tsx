import React from 'react';

import { Environment } from '@novx/core';
import { DeploymentManager, EnvironmentContext, Feature, RouterManager } from '@novx/portal';


@Feature({
  id: "hello",
  label: "hello",
  path: "/hello",
  icon: "shell:add",
  description: "hello",
  tags: ["menu"],
  permissions: [],
  features: [],
  visibility: ["private", "public"]
})
class HelloFeature extends React.Component {
  render() {
    return <div>
      HELLO
    </div>;
  }
}

export class App extends React.Component {
    state = {ready: false};
    routerManager!: RouterManager;

    static contextType = EnvironmentContext

    declare context: Environment

    async componentDidMount() { 
        this.routerManager = this.context.get(RouterManager);
        const deploymentManager = this.context.get(DeploymentManager);

        deploymentManager.checkLazyFeatures('shell', import.meta.webpackContext('./', { 
                recursive: true, 
                regExp: /\.tsx$/ 
            }
        )); 

        // mark ready

        this.setState({ready: true});
    }

    render() {
        if (!this.state.ready) 
          return <div>Loading application…</div>;

        // render the router with lazy FeatureOutlets

        return (
            this.routerManager.renderRouter()
        );
    }
}

export default App;
