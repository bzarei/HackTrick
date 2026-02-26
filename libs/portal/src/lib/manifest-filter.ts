import { FeatureMetadata } from './feature-registry';
import { ClientInfo, Manifest } from './model';

export interface FilterContext {
  clientInfo: ClientInfo;

  hasPermission(permission: string): boolean;
  hasFeature(permission: string): boolean;
}

export interface ManifestFilter {
  accept(manifest: Manifest, context: FilterContext) : boolean
}

export interface FeatureFilter {
  accept(feature: FeatureMetadata, context: FilterContext): boolean;
}

export class FeaturePermissionFilter implements FeatureFilter {
  // implement

  accept(feature: FeatureMetadata, context: FilterContext): boolean {
    if (feature.permissions)
      for (const permission of feature.permissions)
        if (!context.hasPermission(permission))
          return false

    return true
  }
}

export class FeatureClientInfoFilter implements FeatureFilter {
  // implement

  accept(feature: FeatureMetadata, context: FilterContext): boolean {
    if (!feature.clients)
      return true;

    const constraints = feature.clients;
    const client = context.clientInfo;

    // Check screen sizes
    if (constraints.screenSizes && constraints.screenSizes.length > 0) {
      if (!constraints.screenSizes.includes(client.screen_size))
        return false;
    }

    // Check orientation
    if (constraints.orientation && constraints.orientation.length > 0) {
      if (!constraints.orientation.includes(client.orientation))
        return false;
    }

    // Check platforms
    if (constraints.platforms && constraints.platforms.length > 0) {
      if (!constraints.platforms.includes(client.platform))
        return false;
    }

    // Check width constraints
    if (constraints.minWidth !== null && constraints.minWidth !== undefined) {
      if (client.width < constraints.minWidth)
        return false;
    }
    if (constraints.maxWidth !== null && constraints.maxWidth !== undefined) {
      if (client.width > constraints.maxWidth)
        return false;
    }

    // Check height constraints
    if (constraints.minHeight !== null && constraints.minHeight !== undefined) {
      if (client.height < constraints.minHeight)
        return false;
    }
    if (constraints.maxHeight !== null && constraints.maxHeight !== undefined) {
      if (client.height > constraints.maxHeight)
        return false;
    }

    // Check capabilities
    if (constraints.capabilities && constraints.capabilities.length > 0) {
      for (const capability of constraints.capabilities) {
        if (!client.capabilities.includes(capability))
          return false;
      }
    }

    return true;
  }
}

export class FeatureEnabledFilter implements FeatureFilter {
  // implement

  accept(feature: FeatureMetadata, context: FilterContext): boolean {
    if (feature.enabled !== undefined && !feature.enabled)
      return false;

    return true;
  }
}

export class FeatureFeatureFilter implements FeatureFilter {
  // implement

  accept(feature: FeatureMetadata, context: FilterContext): boolean {
    if (feature.features != undefined)
      for (const f of feature.features)
        if (!context.hasFeature(f))
          return false;

    return true;
  }
}

export class ManifestEnabledFilter implements ManifestFilter {
  accept(manifest: Manifest, context: FilterContext): boolean {
    if (manifest.enabled !== undefined)
      return manifest.enabled;

    return true
  }
}

export class ManifestProcessor {
  // instance data

  private readonly manifestFilters: ManifestFilter[]
  private readonly featureFilters: FeatureFilter[]

  // constructor

  constructor() {
    this.manifestFilters = [new ManifestEnabledFilter()];
    this.featureFilters = [
      new FeaturePermissionFilter(),
      new FeatureClientInfoFilter(),
      new FeatureEnabledFilter(),
      new FeatureFeatureFilter()
    ];
  }

  // public

  process(manifest: Manifest, context: FilterContext): Manifest {
    // First, check if the manifest itself passes all manifest filters
    for (const filter of this.manifestFilters) {
      if (!filter.accept(manifest, context)) {
        // Return empty manifest if manifest-level filter fails
        return {
          ...manifest,
          features: [],
        };
      }
    }

    // Filter features

    const filteredFeatures = manifest.features.filter((feature) => {
      // apply all feature filters
      for (const filter of this.featureFilters) {
        if (!filter.accept(feature as FeatureMetadata, context))
          return false;
      }

      return true;
    });

    // done

    return {
      ...manifest,
      features: filteredFeatures,
    };
  }
}


