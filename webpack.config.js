module.exports = {
  entry: "./view/index.ts",
  output: {
    filename: "bundle.js"
  },
  resolve: {
    extensions: ["", ".webpack.js", ".web.js", ".ts", ".js"]
  },
  module: {
    loaders: [
      { test: /\.(png|woff|woff2|eot|ttf|svg)$/, loader: 'url-loader?limit=100000' },
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
}