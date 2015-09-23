/*
 * grunt-phantomflow
 * Copyright (c) 2014 Huddle
 * Licensed under The MIT License (MIT).
 */

module.exports = function ( grunt ) {

	grunt.registerMultiTask( 'phantomflow', 'UI testing with decision trees', function () {

		var phantomflow = require( 'phantomflow' ).init( {
			test: grunt.option( 'test' ), // to run a specific test
			debug: grunt.option( 'debug' ),
			casperArgs: this.data.casperArgs || [],
			createReport: this.data.createReport,
			reports: this.data.reports,
			includes: this.data.includes,
			tests: this.data.tests,
			results: this.data.results,
			threads: grunt.option('threads') || this.data.threads,
			mismatchTolerance: grunt.option('mismatchTolerance') || this.data.mismatchTolerance,
			earlyExit: grunt.option( 'earlyexit' ),
			novisuals: grunt.option( 'novisuals' ),
			hideElements: this.data.hideElements || [],
			remoteDebug: this.data.remoteDebug,
			remoteDebugAutoStart: this.data.remoteDebugAutoStart,
			remoteDebugPort: this.data.remoteDebugPort
		} );

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