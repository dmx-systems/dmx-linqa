const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const {VueLoaderPlugin} = require('vue-loader')
const {DefinePlugin} = require('webpack')
const path = require('path')

module.exports = (env = {}) => {

  const webpackConfig = {
    entry: './src/main/js/main.js',
    output: {
      path: path.join(__dirname, '/target/classes/web'),
      filename: env.dev ? '[name].js' : '[chunkhash].[name].js'
    },
    resolve: {
      extensions: ['.js', '.mjs', '.vue']
    },
    module: {
      rules: [
        {
          test: /\.vue$/,
          use: 'vue-loader'
        },
        {
          test: /\.m?js$/,
          use: 'babel-loader',
          exclude: /node_modules\/(?!quill)/
        },
        {
          test: /\.css$/,
          use: [env.dev ? 'style-loader' : MiniCssExtractPlugin.loader, 'css-loader']
        },
        {
          test: /\.(png|jpg|jpeg|gif|eot|ttf|woff|woff2|svg|svgz)(\?.+)?$/,
          type: 'asset/resource'
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: 'src/main/resources-build/index.html',
        favicon:  'src/main/resources-build/favicon.png'
      }),
      new MiniCssExtractPlugin({
        filename: env.dev ? '[name].css' : '[contenthash].[name].css'
      }),
      new VueLoaderPlugin(),
      new DefinePlugin({
        DEV: env.dev
      })
    ],
    stats: {
      entrypoints: false,
      children: false,
      assetsSort: 'chunks'
    },
    performance: {
      hints: false
    }
  }

  if (env.dev) {
    webpackConfig.devServer = {
      port: 8084,
      proxy: {'/': 'http://localhost:8080'},
      noInfo: true,
      open: true
    }
  }

  return webpackConfig
}
