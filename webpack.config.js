module.exports = {
  entry: {
    loader: "./view/loader.ts",
    index: "./view/index.ts"
  },
  output: {
    filename: "bundle_[name].js"
  },
  resolve: {
    extensions: ["", ".webpack.js", ".web.js", ".ts", ".js"]
  },
  module: {
    loaders: [
      { test: /\.(png|woff|woff2|eot|ttf|svg)$/, loader: 'url-loader?limit=17179869184' },
      { test: /\.css$/, loader: "style-loader!css-loader" },
      { test: /\.ts$/, loader: "ts-loader" }
    ]
  },
  devServer: {
    contentBase: "./view"
  },
  externals: {
    jquery: "jQuery"
  }
};