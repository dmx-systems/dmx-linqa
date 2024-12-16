const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { VueLoaderPlugin } = require('vue-loader')
const { DefinePlugin } = require('webpack')
const AutoImport = require('unplugin-auto-import/webpack').default
const Components = require('unplugin-vue-components/webpack').default
const { ElementPlusResolver } = require('unplugin-vue-components/resolvers')
const path = require('path')

module.exports = env => {

  const webpackConfig = {
    entry: './src/main/js/main.js',
    output: {
      path: path.join(__dirname, '/target/classes/web'),
      filename: env.WEBPACK_SERVE ? '[name].js' : '[contenthash].[name].js'
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
          use: [env.WEBPACK_SERVE ? 'style-loader' : MiniCssExtractPlugin.loader, 'css-loader']
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
        filename: env.WEBPACK_SERVE ? '[name].css' : '[contenthash].[name].css'
      }),
      new VueLoaderPlugin(),
      new DefinePlugin({
        DEV: env.WEBPACK_SERVE,
        __VUE_OPTIONS_API__: 'true',
        __VUE_PROD_DEVTOOLS__: 'false',
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false'
      }),
      AutoImport({
        resolvers: [ElementPlusResolver()]
      }),
      Components({
        resolvers: [ElementPlusResolver()]
      })
    ],
    stats: {
      assets: false,
      modules: false
    },
    performance: {
      hints: false
    }
  }

  if (env.WEBPACK_SERVE) {
    webpackConfig.devServer = {
      port: 8084,
      proxy: [{
        context: '/',
        target: 'http://localhost:8080'
      }],
      open: true
    }
  }

  return webpackConfig
}
