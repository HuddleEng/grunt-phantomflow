/*
 * grunt-phantomflow
 * Copyright (c) 2014 Huddle
 * Licensed under The MIT License (MIT).
 */

var _ = require('lodash');

module.exports = function ( grunt ) {

	grunt.registerMultiTask( 'phantomflow', 'UI testing with decision trees', function () {

		var overrides = {
			test: grunt.option( 'test' ),
			debug: grunt.option( 'debug' ),
			threads: grunt.option('threads'),
			mismatchTolerance: grunt.option('mismatchTolerance'),
			earlyExit: grunt.option( 'earlyexit' ),
			novisuals: grunt.option( 'novisuals' ),
		};

		var phantomflow = require( 'phantomflow' ).init( _.defaults( overrides, this.data ) );

		var done = this.async();

		if ( grunt.option( 'report' ) ) {
			phantomflow.report();
			return;
		}

		phantomflow.run( function ( code ) {
			done( code == 0 );
		} );

	} );
};