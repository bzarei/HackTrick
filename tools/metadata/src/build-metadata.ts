#!/usr/bin/env tsx
import * as fs from "fs";
import * as path from "path";
import { FeatureMetadataParser, FeatureMetadataScanner } from "./feature-parser";

// read CLI args
const args = process.argv.slice(2);
const moduleFolderArgIndex = args.findIndex(a => a.startsWith("--moduleFolder="));
const outFileArgIndex = args.findIndex(a => a.startsWith("--outFile="));
const webpackConfigArgIndex = args.findIndex(a => a.startsWith("--webpackConfig="));

if (moduleFolderArgIndex === -1 || outFileArgIndex === -1) {
  throw new Error("Usage: build-metadata.ts --moduleFolder=<path> --outFile=<file> [--webpackConfig=<file>]");
}

const moduleFolder = args[moduleFolderArgIndex].split("=")[1];
const outputFile = args[outFileArgIndex].split("=")[1];
const webpackConfigFile = webpackConfigArgIndex !== -1 ? args[webpackConfigArgIndex].split("=")[1] : null;

// determine tsconfig in the module folder
const tsconfigFile = fs.existsSync(path.join(moduleFolder, "tsconfig.app.json"))
    ? path.join(moduleFolder, "tsconfig.app.json")
    : fs.existsSync(path.join(moduleFolder, "tsconfig.json"))
    ? path.join(moduleFolder, "tsconfig.json")
    : (() => { throw new Error(`No tsconfig found in ${moduleFolder}. Tried tsconfig.json and tsconfig.app.json`); })();

// parse features
const parser = new FeatureMetadataParser(tsconfigFile);
const moduleData = parser.parseDirectory(moduleFolder);

console.log(moduleData);

// export JSON and update webpack config
if (moduleData.length > 0) {
  FeatureMetadataScanner.exportToJSON(moduleData[0], outputFile);

  // Update webpack config if provided
  if (webpackConfigFile) {
    FeatureMetadataScanner.updateWebpackConfig(moduleData[0], webpackConfigFile);
  } else {
    // Try to auto-detect webpack.config.js in the module folder
    const autoWebpackConfig = path.join(moduleFolder, "webpack.config.js");
    if (fs.existsSync(autoWebpackConfig)) {
      FeatureMetadataScanner.updateWebpackConfig(moduleData[0], autoWebpackConfig);
    }
  }
}
