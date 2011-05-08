
var TestRunnerPage = window.TestRunnerPage || {};
TestRunnerPage._abortExecution = true;
TestRunnerPage._abortMessage =
	"TestRunnerPage._abortExecution is true. " +
	"Check for errors on this test page in your JavaScript console.";
TestRunnerPage.timers = {};

if(!TestRunnerPage.modules) {
	throw Error("TestRunnerPage.modules not defined or falsy");
}

if(TestRunnerPage.modules.length == 0) {
	throw Error("TestRunnerPage: 0 modules");
}

/**
 * Clone just the property strings, ignore the values.
 * @return {'propertyname': true, ...} for each property in C{object}.
 */
TestRunnerPage.cloneProperties = function(object) {
	var c = {}, k;
	for(k in object) {
		c[k] = true;
	};
	return c;
}


TestRunnerPage.getNewProperties = function(oldSet, object) {
	var k;
	var newProps = [];
	for(k in object) {
		if(!oldSet[k]) {
			newProps.push(k);
		}
	}
	return newProps;
}


TestRunnerPage.toggleVisibility = function(id) {
	var e = document.getElementById(id);
	if(e.style.display == 'block' || !e.style.display) {
		e.style.display = 'none';
	} else {
		e.style.display = 'block';
	}
}


TestRunnerPage.logNewProps = function() {
	var newProps = TestRunnerPage.getNewProperties(TestRunnerPage.propsBefore, window);
	TestRunnerPage.logger.info('New window properties: ' + newProps.join(', '));
}


TestRunnerPage.moduleNamesToObjects = function(moduleNames) {
	var objects = [];
	for(var i=0; i < moduleNames.length; i++) {
		var obj = goog.getObjectByName(moduleNames[i]);
		if(obj == null) {
			throw Error("Could not get module object for " +
				moduleNames[i] + " - check your goog.provide lines?");
		}
		objects.push(obj);
	}
	return objects;
}


TestRunnerPage.startTests = function() {
	TestRunnerPage.logger.info('Running tests.');

	var moduleObjects = TestRunnerPage.moduleNamesToObjects(TestRunnerPage.modules);
	var suite = cw.UnitTest.loadFromModules(moduleObjects);

	var outputDiv = document.getElementById('TestRunnerPage-results');
	var d = cw.UnitTest.runWeb(suite, outputDiv);
	d.addCallback(TestRunnerPage.logNewProps);
}



// Enumerate properties now and check for new ones later, to
// to make sure there's very little `window` pollution besides
//`TestRunnerPage` and `CW`.

// We look at the properties before we even load the <script>,
// in case there's a bug that leaks a variable at the top-level scope of the script.
TestRunnerPage.propsBefore = TestRunnerPage.cloneProperties(window);

TestRunnerPage.timers.scriptLoadStart = +new Date; /* scripts begin */

TestRunnerPage._abortExecution = false;
