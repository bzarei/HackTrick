import { createRoot } from 'react-dom/client';
import App from './app/App';
import { createEnvironment } from './module';
import { EnvironmentContext } from '@novx/portal';


const environment = await createEnvironment();

const root = createRoot(document.getElementById('root')!);
root.render(
    <EnvironmentContext.Provider value={environment}>
      <App />
    </EnvironmentContext.Provider>
    );