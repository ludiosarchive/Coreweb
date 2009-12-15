/**
 * Various tools for introspecting objects at runtime.
 */


/**
 * Retrieve an C{Array} of C{String}s naming the methods defined on the given
 * class and its parent classes.
 */

CW.Inspect.methods = function(cls) {
	if (typeof cls != "function") {
		throw new Error("Only classes have methods.");
	}
	var result = [];
	return result.concat(CW.dir(cls.prototype)).sort();
};

