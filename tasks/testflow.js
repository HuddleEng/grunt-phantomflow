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
	var datauri = require('datauri');

	grunt.registerMultiTask('testflow', 'UI testing with user flows', function() {

		var time = Date.now();

		var filterTests = grunt.option('test');
		var optionDebug = grunt.option('debug');

		var libsPath = path.join(__dirname, '..', 'node_modules', 'phantomflow');
		var bootstrapPath = path.join(__dirname, '..', 'bootstrap');
		var casperPath = path.join( libsPath, 'casperjs.bat');
		
		var createReport = this.data.createReport;

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
		
		var visualTestsPath = changeSlashes(tests + '/visuals/');

		var dataPath = changeSlashes(results + '/data/');
		var xUnitPath = changeSlashes(results + '/xunit/');
		var debugPath = changeSlashes(results + '/debug/');
		var reportPath = changeSlashes(results + '/report/');
		var visualResultsPath = changeSlashes(results + '/visuals/');

		var loggedErrors = [];
		var failCount = 0;
		var passCount = 0;

		function writeLog(filename, log, exit){
			var path = results +  '/log/';
			
			if(!grunt.file.isDir(path)){
				grunt.file.mkdir(path);
			}

			path = path + filename;

			fs.writeFile( path, log, function(){
				console.log((" Please take a look at the error log for more info '"+path+"'").bold.yellow);
				if(exit){
					done();
				}
			});
		}

		if(grunt.option('report')){
			if(showReport(reportPath)){
				done();
			}
			return;
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
		files = _.filter(
			grunt.file.expand([tests + '/**/*.test.js']),
			function(file){
				return grunt.file.isFile(file);
			}
		).map(function(file){
			return path.relative(tests, file);
		});

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
		
		if(grunt.file.isDir(results)){
			grunt.file.delete(results);
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

				var mergedData;
				
				if(code !== 0 ){
					console.log(('It broke, sorry. Threads aborted. Non-zero code ('+code+') returned.').red);
					writeLog(failFileName, stdoutStr, earlyExit);
				}

				threadCompletionCount += 1;

				if(threadCompletionCount === threads){
					console.log( 'All the threads have completed. \n'.grey );

					loggedErrors.forEach(function(error){
						console.log(('== '+error.file).white);
						console.log(error.msg.bold.red);
					});

					console.log( 
						('Completed '+(failCount+passCount) + ' tests in ' + Math.round((Date.now() - time) / 1000) + ' seconds. ') + 
						(failCount + ' failed, ').bold.red + 
						(passCount + ' passed. ').bold.green);

					if(createReport){

						mergedData = concatData(dataPath,visualTestsPath,visualResultsPath);

						copyReportTemplate(
							mergedData,
							reportPath,
							createReport
						);
					}

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
						console.log(line.bold.red);

						loggedErrors.push({
							file: currentTestFile,
							msg: line
						});

						failCount++;

						if(earlyExit === true){
							writeLog(failFileName, stdoutStr, true);
						}

					} else if (/PASS/.test(line)){
						passCount++;
						console.log(line.green);
					} else if (/DEBUG/.test(line)){
						console.log(line.yellow);
					} else if(threads === 1){
						console.log(line.white);
					}

					stdoutStr += line;
				});
			});

		});

		function concatData(dataPath, imagePath, imageResultPath){
			// do concatination and transform here to allow parallelisation in PhantomFlow

			var data = {};
			var stringifiedData;

			grunt.file.recurse(dataPath, function(abspath, rootdir, subdir, filename){
				data[filename] = grunt.file.readJSON(abspath);
			});

			stringifiedData = JSON.stringify(data, function(k,v){
				return dataTransform(k,v, imagePath, imageResultPath)
			}, 2);

			return stringifiedData;
		}

		function copyReportTemplate(data, dir, templateName){
			templateName = typeof templateName == 'string' ? templateName : 'Dendrogram';

			var templates = path.join(__dirname, '..', 'report_templates');
			var template = path.join(templates, templateName);
			var datafilename = path.join(dir, 'data.js');

			if( grunt.file.isDir(template) ){
				grunt.file.recurse(template, function(abspath, rootdir, subdir, filename){
					var dest = path.join(dir,filename);

					if(grunt.file.isFile(dest)){
						grunt.file.delete(dest);
					}
					grunt.file.copy( abspath, dest );
				});

				if(grunt.file.isFile(datafilename)){
					grunt.file.delete(datafilename);
				}
				grunt.file.write(datafilename, data);
			}
		}

		function dataTransform(key, value, imagePath, imageResultPath){
			var obj, ori, latest, fail;
			if(key === 'screenshot'){

				ori = path.join(imageResultPath, changeSlashes(value));

				if(grunt.file.isFile(ori)){

					latest = ori.replace(/.png$/, '.diff.png');
					fail = ori.replace(/.png$/, '.fail.png');

					obj = {
						original: datauri(ori)
					};

					if(grunt.file.isFile(fail)){
						obj.failure = datauri(fail);
						if(grunt.file.isFile(latest)){
							obj.latest = datauri(latest);
						}
					}

					return obj;
				} else {
					console.log(("Expected file does not exist! "+ value).bold.yellow);
					return null;
				}
			}

			return value;
		}

		function showReport(dir){
			if(grunt.file.isDir(dir)){
				console.log("Please use ctrl+c to escape".bold.green);
				connect(connect.static(dir)).listen(9001);
				open('http://localhost:9001');
				return false;
			} else {
				console.log("A report hasn't been generated.  Maybe you haven't set the createReport option?".bold.yellow);
				return true;
			}
		}

		function changeSlashes(str){
			return path.normalize(str).replace(/\\/g, '/');
		}

	});
};