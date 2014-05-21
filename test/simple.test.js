
(function(){

	flow("Something", function(){
		step("Yay", function(){
			casper.test.pass('woot');
		});
		decision({
			'ORLY': function(){
				step("Yay", function(){
					casper.test.assert(true, 'Bam!');
				});
			},
			'Woh': function(){
				step("Yay", function(){
					casper.test.fail('*SIGH*');
				});	
			}
		});
	});

}());