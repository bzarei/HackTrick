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
      '@novx/core': path.resolve(__dirname, '../../libs/core/src'),
      '@novx/i18n': path.resolve(__dirname, '../../libs/i18n/src'),
      '@novx/communication': path.resolve(__dirname, '../../libs/communication/src'),
      '@novx/portal': path.resolve(__dirname, '../../libs/portal/src')
    },
    fallback: {
      fs: false, // disables 'fs' module
      path: require.resolve('path-browserify') // polyfill 'path'
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