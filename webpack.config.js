const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/ui/index.js',
  output: {
    filename: 'bundle.[fullhash].js',
    path: path.resolve(__dirname, 'src', 'public'),
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.(jsx?)$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: 'style-loader'
          },
          {
            loader: 'css-loader',
            options: {
              modules: true,
              localsConvention: 'camelCase',
              sourceMap: true
            }
          }
        ]
      },
      {
        test: /\.less$/i,
        use: [
          {loader: 'style-loader'},
          {loader: 'css-loader'},
          {loader: 'less-loader'},
        ],
      }
    ]
  },
  resolve: {
    extensions: ['*', '.js']
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      title: 'NodePad',
      template: 'src/ui/index.html',
      favicon: path.resolve(__dirname, 'assets', 'logo', 'nodepad_favicon.png'), 
    }),
    new CopyPlugin({
      patterns: [
        { 
          from: path.resolve(__dirname, 'src', 'ui', 'static'), 
          to: path.resolve(__dirname, 'src', 'public'), 
        }
      ],
    })
  ]
};