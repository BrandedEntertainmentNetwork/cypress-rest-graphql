//const webpackPreprocessor = require('cypress-webpack-preprocessor-v5');
const webpackPreprocessor = require('@cypress/webpack-preprocessor');


module.exports = (on) => {
  console.log('OH HIA :)')
  const options = webpackPreprocessor.defaultOptions;

  console.log(options);
  console.log(options.webpackOptions.module.rules);

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

  // options.webpackOptions.module.rules.push({
  //   test: /\.scss$/i,
  //   use: [
  //     {
  //       loader: 'css-loader',
  //       options: {
  //         esModule: false,
  //         importLoaders: 2,
  //         modules: false,
  //         sourceMap: true,
  //         url: false,
  //       },
  //     },
      
  //   ],
  // });

  on('file:preprocessor', webpackPreprocessor(options));
};