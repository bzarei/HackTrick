import React from 'react';

import { Environment } from '@novx/core';
import { DeploymentManager, EnvironmentContext, Feature, RouterManager } from '@novx/portal';


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
