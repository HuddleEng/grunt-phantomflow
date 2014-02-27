'use strict';

/*
 * grunt-testflow
 * homepage
 *
 * Copyright (c) 2014 Huddle
 * Licensed under The MIT License (MIT).
 */

module.exports = function(grunt) {

	var path = require('path');
	var util = require('util');
	var fs = require('fs');
	var _ = require('lodash');
	var colors = require('colors');
	var connect = require('connect');
	var open = require('open');

	function showReport(){
		var data = {};
		var done = this.async();

		var datafilename = path.join(__dirname, '..', 'report', 'data.js');

		grunt.file.delete(datafilename);

		grunt.file.recurse(this.data.flowTreeOutput, function(abspath, rootdir, subdir, filename){
			data[filename] = grunt.file.readJSON(abspath);
		});

		grunt.file.recurse(this.data.visualTests, function(abspath, rootdir, subdir, filename){
			grunt.file.copy(abspath, path.join(__dirname, '..', 'report', abspath) );
		});

		grunt.file.write(datafilename, JSON.stringify(data));

		connect(connect.static(path.join(__dirname, '..', 'report'))).listen(9001);
		open('http://localhost:9001');
	}

	grunt.registerMultiTask('testflow', 'UI testing with user flows', function() {

		if(this.target === 'report'){
			_.bind(showReport, this)();
			return;
		}

		var time = Date.now();

		var filterTests = grunt.option('test');
		var optionDebug = grunt.option('debug');

		var libsPath = path.join(__dirname, '..', 'node_modules', 'phantomflow');
		var bootstrapPath = path.join(__dirname, '..', 'bootstrap');
		var casperPath = path.join( libsPath, 'casperjs.bat');
		
		var includes = path.resolve(this.data.includes || 'include');
		var tests = path.resolve(this.data.tests || 'test') + '/';
		var results = path.resolve(this.data.results || 'test-results');
	
		var files;
		
		var threads = grunt.option('threads') || this.data.threads || 4;
		
		/*
			Set to false if you do not want the tests to return on the first failure
		*/
		var earlyExit = typeof grunt.option('earlyexit') === 'undefined' ? false : grunt.option('earlyexit');
		
		var threadCompletionCount = 0;
		var fileGroups;

		var dontDoVisuals = grunt.option('novisuals');

		var args = [];
		var done = this.async();
		
		var visualTestsPath = tests + '/visuals/';

		var dataPath = results + '/data/';
		var xUnitPath = results + '/xunit/';
		var debugPath = results + '/debug/';
		var visualResultsPath = results + '/visuals/';

		function changeSlashes(str){
			return str.replace(/\\/g, '/');
		}

		function writeLog(filename, log, exit){
			var path = results +  '/log/' + filename;
			fs.writeFile( path, log, function(){
				console.log((" Please take a look at the error log for more info '"+path+"'").bold.yellow);
				if(exit){
					done();
				}
			});
		}

		grunt.file.expand(
			[
				visualResultsPath + '/**/*.fail.png', 
				xUnitPath + '/*.xml', 
				dataPath + '/**/*.js'
			]
		).forEach(
			function(file){
				grunt.file.delete(file);
			}
		);

		/* 
			Get the paths for all the tests
		*/
		files = _.map(
			grunt.file.expand([tests + '/**/*.test.js']), 
			function(file){ 
				return path.relative(tests, file); 
			}
		);

		console.log(files.length);

		/*
			Filter tests down to match specified string
		*/
		if(filterTests){
			files = _.filter(files, function(file){ return file.toLowerCase().indexOf( filterTests.toLowerCase() ) !== -1; });
			threads = 1;
		}

		/*
			Stop if there are no tests
		*/
		if(files.length === 0){
			done();
		}

		/*
			Group the files for thread parallelization
		*/
		fileGroups = _.groupBy(files, function(val, index){ return index % threads; });

		/*
			Setup arguments to be sent into PhantomJS
		*/
		args.push(path.join(bootstrapPath, 'start.js'));
		args.push('--flowincludes='+ includes );
		args.push('--flowtestsroot='+ changeSlashes(tests) );
		args.push('--flowbootstraproot='+ bootstrapPath );
		args.push('--flowlibraryroot='+ libsPath );
		args.push('--flowoutputroot='+ dataPath );
		args.push('--flowxunitoutputroot='+ xUnitPath );
		args.push('--flowvisualdebugroot='+ debugPath );
		args.push('--flowvisualstestroot='+ changeSlashes(visualTestsPath) );
		args.push('--flowvisualsoutputroot='+ changeSlashes(visualResultsPath) );
		args.push('--debug='+optionDebug);
		
		if( optionDebug === 2 ){
			earlyExit = false;
		}

		if(dontDoVisuals){
			args.push('--novisuals='+dontDoVisuals);
		}
		
		console.log( 'Parallelising ' + files.length + ' test files on ' + threads + ' threads.\n');

		_.forEach(fileGroups, function(files, index){

			var groupArgs = args.slice(0);
			var child;
			var currentTestFile = '';
			var stdoutStr = '';
			var failFileName = 'error_'+index+'.log';
			
			groupArgs.push('--flowtests='+changeSlashes(files.join(',')));

			child = grunt.util.spawn({
				cmd: casperPath,
				args: groupArgs,
				opts: { stdio: false }
			}, function(error, stdout, code) {
				
				if(code !== 0 ){
					console.log(('It broke, sorry. Threads aborted. Non-zero code ('+code+') returned.').red);
					writeLog(failFileName, stdoutStr, earlyExit);
				}

				threadCompletionCount += 1;

				if(threadCompletionCount === threads){
					console.log( 'All the threads have completed. \n'.yellow );
					console.log( ('Completed in ' + (Date.now() - time) / 1000 + ' seconds.').bold.green );
					done();
				} else {
					console.log( 'A thread has completed. \n'.yellow );
				}
			});

			child.stdout.on('data', function(buf) {
				var bufstr = String(buf);

				bufstr.split(/\n/g).forEach(function(line){

					if (/TESTFILE/.test(line)){
						currentTestFile = line.replace('TESTFILE ', '');
					}

					if(/FAIL/.test(line)){
						console.log(('** '+currentTestFile).bold.red);
						console.log(line.bold.red);

						if(earlyExit === true){
							writeLog(failFileName, stdoutStr, true);
						}

					} else if (/PASS/.test(line)){
						console.log(line.green);
					} else if (/DEBUG/.test(line)){
						console.log(line.bold.yellow);
					} else if(threads === 1){
						console.log(line.white);
					}

					stdoutStr += line;
				});
			});

			// process.on('exit', function() {
			// 	child.kill();
			// });

		});

	});
};