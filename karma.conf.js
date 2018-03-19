module.exports = function(config){
  config.set({
    basePath: '',
    frameworks: ['browserify', 'jasmine'],
    files: [
      'src/**/*.js',
      'test/**/*.spec.js'
    ],
    preprocessors: {
      'src/**/*.js': ['jshint', 'browserify'],
      'test/**/*.spec.js': ['jshint', 'browserify']
    },
    browsers: [/*'Chrome', */'PhantomJS'],
    browserify: {
      debug: true,
      bundleDelay: 2000
    }
  });
};
