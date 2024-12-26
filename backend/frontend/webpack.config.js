const path = require("path");
const webpack = require("webpack");

module.exports = {
    entry: "./src/App.js",
    output: {
      path: path.resolve(__dirname, "./static/frontend"),
      filename: "[name].js",
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-react', '@babel/preset-env']
            }
          }
        }
      ]
    },
    optimization: {
      minimize: true,
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
      })
    ]
  };
  