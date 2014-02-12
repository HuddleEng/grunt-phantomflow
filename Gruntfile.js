/*
 * grunt-testflow
 * homepage
 *
 * Copyright (c) 2014 James Cryer / Huddle
 * Licensed under the The MIT License (MIT).
 */

'use strict';

module.exports = function(grunt) {
	var load = grunt.loadNpmTasks;
	var set = grunt.config.set;
	var task = grunt.registerTask;
	var port = 9001;
	
	load('grunt-contrib-connect');

	grunt.loadTasks('tasks');

	task('default', [/*'jshint', */'connect', 'testflow'] );

	set('connect', {
		example: {
			options: {
				port: port,
				base: 'test'
			}
		}
	});

	set('testflow', {
		app: {
			threads: 1
		}/*,
		report: {
			url: 'http://localhost:'+port,
			results: 'test-results/',
		}*/
	});


};