/*
 * grunt-decision
 * homepage
 *
 * Copyright (c) 25 Nov 2013 James Cryer / Huddle
 * Licensed under the The MIT License (MIT).
 */

'use strict';



module.exports = function(grunt) {

	var path = require('path');

  // Project configuration.
  grunt.initConfig({
	// jshint: {
	//   all: [
	//     'Gruntfile.js',
	//     'tasks/*.js',
	//     '<%= nodeunit.tests %>',
	//   ],
	//   options: {
	//     jshintrc: '.jshintrc',
	//   }
	// },

	// // Before generating any new files, remove any previously-created files.
	// clean: {
	//   tests: ['tmp'],
	// },

	// Configuration to be run (and then tested).
	'testflow': {
		test: {
			options: {},
			fixture: {
				
			},
			includes: path.join(__dirname, 'test', 'fixtures', 'example_include.js'),
			testRoot: path.join(__dirname, 'test', 'fixtures')
		}
	}

	// // Unit tests.
	// nodeunit: {
	//   tests: ['test/*_test.js'],
	// }

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  //grunt.loadNpmTasks('grunt-contrib-jshint');
  //grunt.loadNpmTasks('grunt-contrib-clean');
  //grunt.loadNpmTasks('grunt-contrib-nodeunit');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  //grunt.registerTask('test', ['clean', 'decision', 'nodeunit']);

  // By default, lint and run all tests.
  //grunt.registerTask('default', ['jshint', 'test']);

  grunt.registerTask('default', ['decision']);

};
