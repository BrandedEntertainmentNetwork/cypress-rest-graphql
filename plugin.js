const webpackPreprocessor = require('@cypress/webpack-preprocessor');

module.exports = (on) => {
  const options = webpackPreprocessor.defaultOptions;

  options.webpackOptions.module.rules.push({
    test: /\.css$/i,
    use: [
      {
        loader: 'css-loader',
        options: {
          esModule: false,
          importLoaders: 2,
          modules: false,
          sourceMap: true,
          url: false,
        },
      },
    ],
  });

  on('file:preprocessor', webpackPreprocessor(options));
};