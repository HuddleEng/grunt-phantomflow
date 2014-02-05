'use strict';

/*
 * grunt-testflow
 * homepage
 *
 * Copyright (c) 25 Nov 2013 Huddle
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

		var optionTest = grunt.option('test');
		var optionDebug = grunt.option('debug');

		var libsPath = path.join(__dirname, '..', 'libs');
		var bootstrapPath = path.join(__dirname, '..', 'bootstrap');
		var casperPath = path.join( libsPath, 'casperjs.bat');
		var includes = path.resolve(this.data.includes || '/includes');
		var tests = path.resolve(this.data.tests || '/tests');
		var args = [path.join(bootstrapPath, 'start.js')];
		var done = this.async();
		var files = _.map(grunt.file.expand([tests + '/**/*.test.js']), function(file){ return path.relative(tests, file); });
		var threads = grunt.option('threads') || this.data.threads || 4;
		var earlyExit = typeof grunt.option('earlyexit') === 'undefined' ? true : grunt.option('earlyexit');
		var threadCompletionCount = 0;
		var fileGroups;

		var dontDoVisuals = grunt.option('novisuals');

		function changeSlashes(str){
			return str.replace(/\\/g, '/');
		}

		if( optionDebug === 2 ){
			earlyExit = false; // Don't abort early when debugging with screenshots
		}

		grunt.file.expand([this.data.visualTests + '/**/*.fail.png', this.data.xUnitOutput + '/*.xml', this.data.flowTreeOutput]).forEach(function(file){
			grunt.file.delete(file);
		});

		if(optionTest){
			files = _.filter(files, function(file){ return file.toLowerCase().indexOf( optionTest.toLowerCase() ) !== -1; });
			threads = 1;
		}

		if(files.length === 0){
			done();
		}

		fileGroups = _.groupBy(files, function(val, index){ return index % threads; });

		args.push('--flowincludes='+includes);
		args.push('--flowtestsroot='+changeSlashes(tests));
		args.push('--flowbootstraproot='+bootstrapPath);
		args.push('--flowlibraryroot='+libsPath);
		args.push('--flowoutputroot='+ (this.data.flowTreeOutput || '/data') );
		args.push('--flowxunitoutputroot='+ (this.data.xUnitOutput || '/xunit') );
		args.push('--flowvisualdebugroot='+ (this.data.visualDebug || '/debug') );
		args.push('--flowvisualsroot='+changeSlashes(this.data.visualTests ||'/visualTests') );

		args.push('--debug='+optionDebug);
		
		if(dontDoVisuals){
			args.push('--novisuals='+dontDoVisuals);
		}
		
		console.log( 'Parallelising ' + files.length + ' test files on ' + threads + ' threads.\n');

		_.forEach(fileGroups, function(files, index){

			var groupArgs = args.slice(0);
			var child;
			var currentTestFile = '';
			var stdoutStr = '';
			var failFileName = 'flow_thread_error_'+index+'.log';
			
			groupArgs.push('--flowtests='+changeSlashes(files.join(',')));

			child = grunt.util.spawn({
				cmd: casperPath,
				args: groupArgs,
				opts: { stdio: false }
			}, function(error, stdout, code) {
				
				if(code !== 0 ){
					console.log(('SOMETHING HIT THE FAN, threads aborted. Non-zero code ('+code+') returned.').red);
					fs.writeFile( failFileName, stdoutStr, function(){
						console.log(("Written error log to '"+failFileName+"'").bold.yellow);
						if(earlyExit){
							done();
						}
					});
				}

				threadCompletionCount += 1;

				if(threadCompletionCount === threads){
					console.log( 'YAY! All the threads have completed. \n'.yellow );
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

						if(earlyExit){
							fs.writeFile(failFileName, stdoutStr, function(){
								console.log(("Written error log to '"+failFileName+"'").bold.yellow);
								done();
							});
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