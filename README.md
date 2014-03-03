# grunt-testflow

> An experimental approach to UI testing for websites and webapps. Using a decision-tree like syntax, testflow attempts to provide a fluent way of describing user flows through tests.  

## Grunt

### Basics

This plugin requires Grunt `~0.4.2`

If you are unfamilar with [Grunt](http://gruntjs.com/) check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins.

```shell
npm install grunt-testflow --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-testflow');
```

### The report task

During the test run, testflow will generate structured data representing the user flows under test.  To view a report of this data run the `:report` task.  This will open up your defalt browser with a visualisation of your tests.

`grunt testflow:report`

### Command line parameters

All command line parameters can be used in conjuntion with each other.

#### Running a specific test

If you're working on a test you can use the `test` parameter to run a specific test file. The value can be a substring of the file name.

`grunt testflow:websitetests --test=mytestfile`

#### Multithreading

By default testflow will divide and execute groups of tests concurrantly on different threads.  By default this is 4 threads

Use the thread parameter to increase the amount of threads and reduce the feedback time.

`grunt testflow:websitetests --threads=8`

#### Debugging

Show more logging: `grunt testflow:websitetests --debug=1`

Save screenshots and show more logging: `grunt testflow:websitetests --debug=2`

By default testflow will not abort when a test fails, set the `earlyexit` parameter to true stop the tests upon seeing the first failure.

`grunt testflow:websitetests --earlyexit=true`

### Overview
In your project's Gruntfile, use either `grunt.initConfig( {} )` or `grunt.config.set( 'testflow', {} )`.

```js

var testflow-config = {
  test: {
    tests: '/mytests'
  },
  report: {} // this task is reserved for reporting only
};

grunt.initConfig({
  decision: testflow-config
};
```

### Options

#### options.debugScreenshots
Type: `String`
Default value: `'/debug'`

Location of screeshots generated during the test run.  Useful for seeing what's going on.  Debugging screenshots are only used when testflow is invoked with `debug=2` from the commandline, e.g. `grunt testflow:websitetests debug=2`

#### options.includes
Type: `String`
Default value: `'/includes'`

The home of your scripts to help testing.  All includes will be evaluated in the PhantomJs global space. ** Note, these are not module includes.

#### options.tests
Type: `String`
Default value: `'/tests'`

The home of your testflow tests

#### options.visualTests
Type: `String`
Default value: `'/visualTests'`

The directory where testflow should put screen captures for visual testing.  If set, this options must also be set for the report task so that visual tests can be shown in the report.

#### options.xUnitOutput
Type: `String`
Default value: `'/xunit'`

testflow will generate xunit reports for better CI integration.