goog.require('goog.debug.Logger');
goog.require('goog.debug.LogManager');
goog.require('goog.debug.Console');
goog.require('goog.debug.HtmlFormatter');

if(TestRunnerPage._abortExecution) {
	throw Error("[0] " + TestRunnerPage._abortMessage);
}
TestRunnerPage._abortExecution = true;

(function() {
	for(var i=0; i < TestRunnerPage.modules.length; i++) {
		var moduleName = TestRunnerPage.modules[i];
		goog.require(moduleName);
	}
})();

TestRunnerPage._abortExecution = false;
