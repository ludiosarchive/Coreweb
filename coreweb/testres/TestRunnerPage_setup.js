if(TestRunnerPage._abortExecution) {
	throw Error("[1] " + TestRunnerPage._abortMessage);
}

TestRunnerPage.timers.scriptLoadEnd = +new Date; /* scripts end */

/*
 * Set up the Firebug console as a log observer.
 */
if (!goog.debug.Console.instance) {
	goog.debug.Console.instance = new goog.debug.Console();
}

goog.debug.Console.instance.setCapturing(true);


TestRunnerPage._htmlFormatter = new goog.debug.HtmlFormatter();

TestRunnerPage._debugLogDiv = document.getElementById('TestRunnerPage-log')
TestRunnerPage._htmlLogOutput = function(logRecord) {
	var htmlString = TestRunnerPage._htmlFormatter.formatRecord(logRecord);

	var span = document.createElement("span");
	span.innerHTML = htmlString;
	TestRunnerPage._debugLogDiv.appendChild(span);
}
goog.debug.LogManager.getRoot().setLevel(goog.debug.Logger.Level.ALL);
goog.debug.LogManager.getRoot().addHandler(TestRunnerPage._htmlLogOutput);

TestRunnerPage.logger = goog.debug.Logger.getLogger('TestRunnerPage');

TestRunnerPage.logger.info(
	"Took " + (TestRunnerPage.timers.scriptLoadEnd - TestRunnerPage.timers.scriptLoadStart) +
	" ms to load scripts.  If this is too long, disable browser extensions "+
	"that watch HTTP requests, like HttpFox or Firebug.");
