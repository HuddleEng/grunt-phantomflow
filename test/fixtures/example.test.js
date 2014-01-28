/* global phantom, require, casper, phantomCSS, phantomFlow, flow, step, chance, decision */


console.log('this is a test');


flow('A test test', function(){

	step('a test test step', function(){

		casper.test.assert(true, "true is true");

	});


});