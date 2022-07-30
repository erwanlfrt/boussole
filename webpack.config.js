const path = require('path');

module.exports = {
  mode: 'development',
  entry: {
    'vue-js-spatial-navigation': './src/index.ts',
    'vue-js-spatial-navigation': './src/index.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'umd',
    library: 'vue-js-spatial-navigation',
    umdNamedDefine: true
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: [/node_modules/],
        loader: 'ts-loader'
      }
    ]
},
};