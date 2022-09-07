const path = require('path');

module.exports = {
  mode: 'development',
  entry: {
    'boussole': './src/index.ts',
    'react': './src/react/index.ts',
    'vue': './src/vue/index.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'umd',
    library: 'boussole',
    umdNamedDefine: true
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: [/node_modules/],
        loader: 'ts-loader'
      },
    ]
},
};