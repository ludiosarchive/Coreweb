package hxjson2;

import hxjson2.TestAll;

class Tests {
	static function main(){
#if (FIREBUG && !neko)
                if(haxe.Firebug.detect()) {
                        haxe.Firebug.redirectTraces();
                }
#end
		var r = new haxe.unit.TestRunner();
		r.add(new TestAll());
		r.run();
	}
}