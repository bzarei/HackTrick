import { createRoot } from 'react-dom/client';

import { EnvironmentContext } from '@novx/portal';


import App from './app/App';
import { createEnvironment } from './module';

// make sure the decorators run

import './feature/hello-feature'
import './navigation/private-navigation'
import './navigation/public-navigation'

// create environment

const environment = await createEnvironment();

const root = createRoot(document.getElementById('root')!);
root.render(
    <EnvironmentContext.Provider value={environment}>
      <App />
    </EnvironmentContext.Provider>
    );