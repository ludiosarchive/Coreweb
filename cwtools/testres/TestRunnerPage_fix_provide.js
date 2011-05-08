// This sucks, but cw.UnitTest needs __name__s.
goog.__origProvide = goog.provide;
goog.provide = function(name) {
	goog.__origProvide(name);
	goog.getObjectByName(name).__name__ = name;
};
