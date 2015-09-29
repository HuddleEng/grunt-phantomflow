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

### Setup


```js
grunt.config.set('phantomflow', {
	app: {
		/*
			How many threads would you like to parallelise on?
			Default value is 4
		*/
		threads: 4

		/*
			Any command line options to be passed down to casper?
			Example: ['--cookies-file=testcookies.txt']
			Default value is []
		*/
		casperArgs: [],

		/*
			Should a report/visualisation be generated after
			the test run? Default value is false
		*/
		createReport: false,

		/*
			Should the report output live somewhere else, e.g. for
			proxying through a real webserver?
			Example: '../visualtest/htdocs'
			Default value is undefined.
			If unset, the default set by PhantomFlow will be used.
		*/
		reports: null,
		
		/*
			Do you have scripts to include?
			Default value is ./include
		*/
		includes: './include',
		
		/*
			Where do the tests live?
			Default value is ./test
		*/
		tests: './test',
		
		/*
			Where should the results go?
			Default value is ./test-results
		*/
		results: './test-results',
		
		/*
			Hide elements in the page
		*/
		hideElements: ['img', 'input']
	}
});
```

### Command line parameters

#### Running a specific test

If you're working on a test you can use the `test` parameter to run a specific test file. The value can be a substring of the file name. Please note that test filenames should follow the *.test.js naming convention.

`grunt phantomflow:websitetests --test=mytestfile`

#### Reporting

To show the PhantomFlow visualisation use the 'report' param. You need to have previously generated a report by setting the createReport option to true. Tests will not be executed when the 'report' param is used. The previously generated visualisation will open in your browser.

`grunt phantomflow:websitetests --report`

#### Multithreading

By default phantomflow will divide and execute groups of tests concurrantly on different threads.  By default this is 4 threads

Use the thread parameter to increase the amount of threads and reduce the feedback time.

`grunt phantomflow:websitetests --threads=8`

#### Debugging

Show more logging: `grunt phantomflow:websitetests --debug=1`

Save screenshots and show more logging: `grunt phantomflow:websitetests --debug=2`

By default phantomflow will not abort when a test fails, set the `earlyexit` parameter to true stop the tests upon seeing the first failure.

`grunt phantomflow:websitetests --earlyexit=true`

#### Remote debugging using Web Inspector.

PhantomJS supports [remote debugging](https://github.com/ariya/phantomjs/wiki/Troubleshooting#remote-debugging). The following grunt options allow you to start phantom with the correct options.

```
grunt.config.set('phantomflow', {
	app: {
		remoteDebug: true, // default false
		remoteDebugAutoStart: false, // default false,
		remoteDebugPort: 9000 // default 9000
	}
});
```

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