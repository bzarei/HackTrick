const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: path.resolve(__dirname, 'src/main.tsx'),
  output: {
    path: path.resolve(__dirname, '../../dist/apps/app'),
    filename: 'bundle.js',
    clean: true
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@core': path.resolve(__dirname, '../../libs/core/src'),
      '@i18n': path.resolve(__dirname, '../../libs/i18n/src'),
      '@communication': path.resolve(__dirname, '../../libs/communication/src')
    }
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        loader: 'ts-loader',
        options: { transpileOnly: true },
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'], // important: include .tsx
      alias: {
            '@novx/core': path.resolve(__dirname, '../../dist/libs/core'),
             '@novx/portal': path.resolve(__dirname, '../../dist/libs/portal'),
            '@novx/i18n': path.resolve(__dirname, '../../dist/libs/i18n')
      },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/index.html')
    })
  ],
  devServer: {
    port: 4200,
    open: true,
    hot: true
  },
  mode: 'development',
  devtool: 'source-map'
};