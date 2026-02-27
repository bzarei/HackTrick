import {injectable} from "@novx/core";
import React from "react";
import {BrowserRouter, RouteObject, useLocation, useRoutes} from "react-router-dom";
import { FeatureRegistry } from './feature-registry';

import type { FeatureMetadata } from './feature-registry';

import { FeatureOutlet } from "./feature-outlet";
import { TraceLevel, Tracer } from '@novx/core';
import { SessionManager } from './session/session-manager';
import { useInject } from "./environment";
import { ErrorPage } from "./component/error-page";

/* ======================================================
 * PrivateRoute Component - checks session status
 * ====================================================== */

const PrivateRoute: React.FC<{ feature: FeatureMetadata; children: React.ReactNode }> = ({ feature, children }) => {
  const [isChecking, setIsChecking] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [sessionManager] = useInject(SessionManager);

  React.useEffect(() => {
    const checkAndEnsureSession = async () => {
      try {
        const hasSession = sessionManager.hasSession();
        
        if (!hasSession) {
          // Store the intended route before opening session
          sessionStorage.setItem('intendedRoute', window.location.pathname);
          
          // Call openSession - this will redirect to Keycloak
          // Don't await or set isChecking to false because it will cause a full redirect
          sessionManager.openSession()
           .then(() => {
              setIsChecking(false); // session is ready
            })
            .catch((err: any) => {
                console.error(`[PrivateRoute] Error during openSession:`, err);
                setError(err.message || 'Login failed');
                setIsChecking(false);
              });
          
          // Don't set isChecking to false here - let the redirect happen
          return;
        }
    else {
          setIsChecking(false);
        }
      }
       catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[PrivateRoute] Error checking session for ${feature.id}:`, message, err);
        setError(message);
        setIsChecking(false);
      }
    };

    checkAndEnsureSession();
  }, [feature.id]);

  if (isChecking) {
    return (
      <div style={{ 
        padding: '40px 20px', 
        textAlign: 'center', 
        background: '#1a1a1a', 
        color: '#fff', 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>🔐</div>
          <div>Verifying authentication...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '40px 20px', 
        background: '#1a1a1a', 
        color: '#ff6b6b', 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>⚠️</div>
          <strong>Authentication Error</strong>
          <div>{error}</div>
          <div style={{ fontSize: '12px', marginTop: '16px', color: '#aaa' }}>
            Check browser console for details
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

/* ======================================================
 * Extended RouteObject with $feature
 * ======================================================
 */

export type RouteObjectWithFeature = RouteObject & {
    $feature: FeatureMetadata;
    children?: RouteObjectWithFeature[];
}

export type FeatureChangeListener = (feature: FeatureMetadata) => void;

@injectable()
export class RouteChangeNotifier {
    private listeners = new Set<(location: any) => void>();

    subscribe(listener: (location: any) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    notify(location: any) {
        for (const listener of this.listeners) {
            try {
                listener(location);
            }
            catch (err) {
                console.error("Route listener failed", err);
            }
        }
    }
}

const RouteChangeListener: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();
    const [notifier] = useInject(RouteChangeNotifier)

    React.useEffect(() => {
        notifier.notify(location);
    }, [location]);

    return <>{children}</>;
};


@injectable()
export class RouterManager {
  // instance data

  private routeObjects: RouteObjectWithFeature[] = [];
  private featureListeners = new Set<FeatureChangeListener>();

  private root: FeatureMetadata = {
    id: "",
    component: ""
  }

  // constructor

  constructor(private featureRegistry: FeatureRegistry) {
  }

  // public

  setRoot(root: FeatureMetadata) {
    this.root = root;
  }

  onFeatureChange(listener: FeatureChangeListener): () => void {
    this.featureListeners.add(listener);
    return () => this.featureListeners.delete(listener);
  }

  emitFeatureChange(feature: FeatureMetadata) {
    for (const listener of this.featureListeners) {
      try {
        listener(feature);
      } 
      catch (err) {
        console.error('FeatureChangeListener failed', err);
      }
    }
  }

  private buildRouteObjects(root: FeatureMetadata): RouteObjectWithFeature[] {
    if (Tracer.ENABLED)
      Tracer.Trace('portal', TraceLevel.HIGH, 'building routes');

    const features = this.featureRegistry.filter((f) => true)

    const build = (feature: FeatureMetadata): RouteObjectWithFeature => {
      const isPrivate = feature.visibility && feature.visibility.includes('private');

      const element = isPrivate ? (
        <PrivateRoute feature={feature}>
          <FeatureOutlet featureId={feature.id} />
        </PrivateRoute>
      ) : (
        <FeatureOutlet featureId={feature.id} />
      );

      // Strip leading slash from path to make it relative for nested routes

      const routePath = (feature.path || '').replace(/^\//, '');

      return {
        path: routePath,
        element: element,
        $feature: feature,
        children: (feature.children || []).map(build),
      };
    };

    this.routeObjects = [
      {
        path: root.path || '',
        element: <FeatureOutlet featureId={root.id} />,
        $feature: root,
        children: [
          ...features

            .filter(
              (feature) => feature !== root && feature.path && !feature.parent && !(feature.tags || []).includes("portal"),
            )
            .map(build),
          // Catch-all error route for undefined paths
          {
            path: '*',
            element: <ErrorPage />,
            $feature: root,
          },
        ],
      },
    ];

    console.log(
      '### Route tree:',
      JSON.stringify(
        this.routeObjects,
        (key, value) => {
          if (key === 'element') return '[React Element]';
          return value;
        },
        2,
      ),
    );

    return this.routeObjects;
  }

  public renderRouter() {
    const RoutesWrapper: React.FC = () => {
      const result = useRoutes(this.getRouteObjects());
      return result;
    };

    return (
      <BrowserRouter>
        <RouteChangeListener>
          <RoutesWrapper />
        </RouteChangeListener>
      </BrowserRouter>
    );
  }

  public getRouteObjects(): RouteObjectWithFeature[] {
    if ( this.routeObjects.length == 0)
      this.buildRouteObjects(this.root);

    return this.routeObjects;
  }
}
