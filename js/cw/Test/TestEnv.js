/**
 * @fileoverview Tests for cw.env
 */
goog.provide('cw.Test.TestEnv');

goog.require('cw.UnitTest');
goog.require('cw.env');
goog.require('goog.userAgent');


// anti-clobbering for JScript
(function(){

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
		var thickness = cw.env.getScrollbarThickness_();
		self.assert(goog.isNumber(thickness));
		self.assert(thickness > 0, thickness);
	},

	function test_getActiveXFlashVersion(self) {
		if(!goog.userAgent.IE) {
			throw new cw.UnitTest.SkipTest("Only works in IE");
		}

		var version = cw.env.getActiveXFlashVersion_();
		self.assert(goog.isString(version) || goog.isNull(version));
		self.assertNotIdentical("", version);
	},

	/**
	 * Test {@link cw.env.extractPlugins_} with the real {@code navigator.plugins}
	 * object.
	 */
	function test_extractPluginsReal(self) {
		if(!(goog.global.navigator && navigator.plugins)) {
			throw new cw.UnitTest.SkipTest("This browser lacks a navigator.plugins");
		}

		var ret = cw.env.extractPlugins_(navigator.plugins);
		var pluginList = ret[0];
		var psig = ret[1];

		self.assert(goog.isArray(pluginList));
		self.assertEqual(navigator.plugins.length, pluginList.length);

		self.assert(goog.isString(psig));
		self.assert(psig.length >= 1); // At minimum, psig contains plugins.length
	},

	/**
	 * Test {@link cw.env.extractPlugins_} with a mock {@code navigator.plugins}
	 * object.
	 */
	function test_extractPluginsMock(self) {
		var ret = cw.env.extractPlugins_(cw.Test.TestEnv.samplePlugins_);
		var pluginList = ret[0];
		var psig = ret[1];

		var expected = [
			["Shockwave Flash","Shockwave Flash 10.0 r12","NPSWF32.dll", [
				["application/x-shockwave-flash","swf","Adobe Flash movie"],
				["application/futuresplash","spl","FutureSplash movie"]]]]

		self.assertEqual(expected, pluginList)
		self.assertEqual('1021524111001232', psig)
	},

	function test_compressPluginSignature(self) {
		self.assertEqual('', cw.env.compressPluginSignature_(''));

		// Taken from test_extractPluginsMock
		var psig = '1021524111001232'
		self.assertEqual('aMALjuVK', cw.env.compressPluginSignature_(psig));
	},

	function test_filterObject(self) {
		var orig = {
			'a': 3, 'b': null, 'c': true, 'd': false, 'e': "str", 'x': function() {}, 'y': [], 'z': {}};
		self.assertEqual({
			'a': 3, 'b': null, 'c': true, 'd': false, 'e': "str"}, cw.env.filterObject_(orig));
	}
);



})(); // end anti-clobbering for JScript
