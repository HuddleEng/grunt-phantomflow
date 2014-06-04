# grunt-phantomflow

> A grunt plugin for [PhantomFlow](https://github.com/Huddle/PhantomFlow)

## Grunt

### Basics

This plugin requires Grunt `~0.4.2`

If you are unfamilar with [Grunt](http://gruntjs.com/) check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins.

```shell
npm install grunt-phantomflow --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-phantomflow');
```

### Command line parameters

All command line parameters can be used in conjuntion with each other.

#### Running a specific test

If you're working on a test you can use the `test` parameter to run a specific test file. The value can be a substring of the file name.

`grunt phantomflow:websitetests --test=mytestfile`

#### Multithreading

By default phantomflow will divide and execute groups of tests concurrantly on different threads.  By default this is 4 threads

Use the thread parameter to increase the amount of threads and reduce the feedback time.

`grunt phantomflow:websitetests --threads=8`

#### Debugging

Show more logging: `grunt phantomflow:websitetests --debug=1`

Save screenshots and show more logging: `grunt phantomflow:websitetests --debug=2`

By default phantomflow will not abort when a test fails, set the `earlyexit` parameter to true stop the tests upon seeing the first failure.

`grunt phantomflow:websitetests --earlyexit=true`

### Overview
In your project's Gruntfile, use either `grunt.initConfig( {} )` or `grunt.config.set( 'phantomflow', {} )`.

```js

var phantomflowConfig = {
  test: {
    tests: '/mytests'
  },
  report: {} // this task is reserved for reporting only
};

grunt.initConfig({
  decision: phantomflowConfig
};
```