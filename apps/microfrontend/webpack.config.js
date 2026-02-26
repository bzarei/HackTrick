const HtmlWebpackPlugin = require("html-webpack-plugin");
const { ModuleFederationPlugin } = require("webpack").container;
const path = require("path");

const foundationShared = {
   "@novx/portal": { singleton: true, eager: true, requiredVersion: false },
   "@novx/core": { singleton: true, eager: true, requiredVersion: false },
   "@novx/communication": { singleton: true, eager: true, requiredVersion: false },
   "@novx/i18n": { singleton: true, eager: true, requiredVersion: false },
};

module.exports = {
  entry: './apps/microfrontend/src/main.tsx',
  mode: 'development',
  devtool: 'source-map',
  devServer: {
    port: 3001,
    static: {
      directory: path.join(__dirname, 'public'),
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: 'http://localhost:3001/',
    crossOriginLoading: 'anonymous',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.json'],
    alias: {
      '@novx/portal': path.resolve(process.cwd(), 'libs/portal/src'),
      '@novx/core': path.resolve(process.cwd(), 'libs/core/src'),
      '@novx/i18n': path.resolve(process.cwd(), 'libs/i18n/src'),
      '@novx/communication': path.resolve(process.cwd(), 'libs/communication/src'),
    },
  },
  module: {
    rules: [
      { test: /\.tsx?$/, loader: 'ts-loader' },
      { test: /\.json$/, type: 'json' },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'microfrontend',
      filename: 'remoteEntry.js',
      exposes: {
        "./MicrofrontendFeature": "./apps/microfrontend/src/feature",
        './Module': './apps/microfrontend/src/Module',
      },
      shared: {
        "reflect-metadata": { singleton: true, requiredVersion: false },
        react: { singleton: true, requiredVersion: false },
        'react-dom': { singleton: true, requiredVersion: false },
        'react-router-dom': { singleton: true, requiredVersion: false },
        "react/jsx-runtime": { singleton: true, requiredVersion: false },

        ...foundationShared,
      },
    }),
    new HtmlWebpackPlugin({
      template: './apps/microfrontend/index.html',
    }),
  ],
};
