/**
 * @fileoverview Tests for cw.env
 */
goog.provide('cw.Test.TestEnv');

goog.require('cw.UnitTest');
goog.require('cw.env');
goog.require('cw.eq');
goog.require('goog.userAgent');
goog.require('goog.object');


// anti-clobbering for JScript; aliases
(function(){

var plainObject = cw.eq.plainObject;

cw.Test.TestEnv.samplePlugins_ = [{
	name: "Shockwave Flash",
	description: "Shockwave Flash 10.0 r12",
	filename: "NPSWF32.dll",
	length: 2,
	0: {type: "application/x-shockwave-flash", suffixes: "swf", description: "Adobe Flash movie"},
	1: {type: "application/futuresplash", suffixes: "spl", description: "FutureSplash movie"}
}];

/**
 * Tests for L{cw.env}
 */
cw.UnitTest.TestCase.subclass(cw.Test.TestEnv, 'EnvTests').methods(
	function test_getScrollbarThickness(self) {
		var thickness = cw.env.getScrollbarThickness();
		self.assertTrue(goog.isNumber(thickness));
		self.assertTrue(thickness > 0, thickness);
	},

	function test_getActiveXFlashVersion(self) {
		var version = cw.env.getActiveXFlashVersion();
		self.assertTrue(goog.isString(version) || goog.isNull(version));
		self.assertNotIdentical("", version);

		if(!goog.userAgent.IE) {
			// In non-IE browsers, it should not find an installed Flash Player plugin.
			self.assertEqual(null, version);
		}
	},

	function test_getActiveXSilverlightVersion(self) {
		var version = cw.env.getActiveXSilverlightVersion();
		self.assertTrue(goog.isString(version) || goog.isNull(version));
		self.assertNotIdentical("", version);

		if(!goog.userAgent.IE) {
			// In non-IE browsers, it should not find an installed Silverlight plugin.
			self.assertEqual(null, version);
		}
	},

	function test_getActiveXGoogleGearsBuildInfo(self) {
		var buildInfo = cw.env.getActiveXGoogleGearsBuildInfo();
		self.assertTrue(goog.isString(buildInfo) || goog.isNull(buildInfo));
		self.assertNotIdentical("", buildInfo);

		if(!goog.userAgent.IE) {
			// In non-IE browsers, it should not find an installed Google Gears plugin.
			self.assertEqual(null, buildInfo);
		}
	},

	function test_probeActiveXObjects(self) {
		var out = cw.env.probeActiveXObjects();
		self.assertEqual('object', goog.typeOf(out));
		for(var k in out) {
			var v = out[k];
			self.assertIn(v[0], [0, 1]);
			self.assertEqual('string', goog.typeOf(v[1]));
		}
	},

	function test_getXHRDefaultWithCredentials(self) {
		var out = cw.env.getXHRDefaultWithCredentials();
		self.assertIn(goog.typeOf(out), goog.object.createSet('boolean', 'null', 'array'));
		if(!goog.userAgent.IE) {
			// Non-IE environments are expected to have a working
			// XMLHttpRequest object.
			self.assertIn(goog.typeOf(out), goog.object.createSet('boolean', 'null'));
		}
		if(goog.userAgent.IE && !goog.userAgent.isVersion('7.0')) {
			self.assertEqual('array', goog.typeOf(out));
		}
	},

	/**
	 * Test {@link cw.env.extractPlugins} with the real {@code navigator.plugins}
	 * object.
	 */
	function test_extractPluginsReal(self) {
		if(!(goog.global.navigator && navigator.plugins)) {
			throw new cw.UnitTest.SkipTest("This browser lacks a navigator.plugins");
		}

		var ret = cw.env.extractPlugins(navigator.plugins);
		self.assertEqual(3, ret.length);
		var pluginList = ret[0];
		var descriptions = ret[1];
		var psig = ret[2];

		self.assertTrue(goog.isArray(pluginList));
		self.assertEqual(navigator.plugins.length, pluginList.length);

		self.assertTrue(goog.isString(psig));
		self.assertTrue(psig.length >= 1); // At minimum, psig contains plugins.length
	},

	/**
	 * Test {@link cw.env.extractPlugins} with a mock {@code navigator.plugins}
	 * object.
	 */
	function test_extractPluginsMock(self) {
		var ret = cw.env.extractPlugins(cw.Test.TestEnv.samplePlugins_);
		var pluginList = ret[0];
		var descriptions = ret[1];
		var psig = ret[2];

		var expectedPluginList = [
			["Shockwave Flash",0,"NPSWF32.dll", [
				["application/x-shockwave-flash","swf",1],
				["application/futuresplash","spl",2]]]]

		var expectedDescriptions = {
			'_Shockwave Flash 10.0 r12': 0,
			'_Adobe Flash movie': 1,
			'_FutureSplash movie': 2
		};

		self.assertEqual(expectedPluginList, pluginList);
		self.assertEqual(plainObject(expectedDescriptions), plainObject(descriptions));
		self.assertEqual('1021524111001232', psig);
	},

	function test_compressPluginSignature(self) {
		self.assertEqual('', cw.env.compressPluginSignature(''));

		// Taken from test_extractPluginsMock
		var psig = '1021524111001232'
		self.assertEqual('aMALjuVK', cw.env.compressPluginSignature(psig));
	},

	function test_filterObject(self) {
		var orig = {
			'a': 3, 'b': null, 'c': true, 'd': false, 'e': "str", 'x': function() {}, 'y': [], 'z': {}};
		var expected = {'a': 3, 'b': null, 'c': true, 'd': false, 'e': "str"};
		self.assertEqual(plainObject(expected), plainObject(cw.env.filterObject(orig)));
	},

	function test_makeReport(self) {
		var report = cw.env.makeReport();
		self.assertTrue(goog.isObject(report));
	}
);



})(); // end anti-clobbering for JScript
