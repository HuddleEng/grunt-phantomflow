/* global phantom, require, casper, phantomCSS, phantomFlow, flow, step, chance, decision */


console.log('this is a nested test');


flow('A nested test test', function(){

	step('a nested test test step', function(){

		casper.test.assert(true, "true is true");

	});


});