// This is code from my crazy attempt to send Unicode over the
// ExternalInterface bridge.  Just don't bother with this idea; send
// ASCII instead.

package cw.exp;

import flash.external.ExternalInterface;

class Experiments {
	public static var sockets:Hash<String> = new Hash();

	public static function echo_raw(anything:Dynamic) {
		//ExternalInterface.call('fromFlash', anything);

		// Maybe this will let us completely bypass Flash's backslashing insanity? YES! Just add a JSON parser that distinguishes null/undefined
		//ExternalInterface.call('(function(){fromFlash({"post": "eval\\tthi\\n\t\x01s", "array": [null, undefined, true, false, 3.5]})})');
		
		//ExternalInterface.call('fromFlash', "Hello X");

		//return 'Hello\tthe"re';
		try{
			ExternalInterface.call('fromFlash', 'Char code[0]: ' + anything.charCodeAt(0));
			ExternalInterface.call('fromFlash', 'Char code[1]: ' + anything.charCodeAt(1));
		}catch(e:Dynamic) {}
		ExternalInterface.call('fromFlash', anything);
		return anything;
	}

	public static function send_all_chars() {
		ExternalInterface.call('append', "haXe problem? " + ("a" != "a")); // sanity check for string equality
		ExternalInterface.call('append', "haXe problem? " + (String.fromCharCode(55296) ==  String.fromCharCode(65532)));
		ExternalInterface.call('append', "haXe problem? " + (String.fromCharCode(55297) ==  String.fromCharCode(65532)));
		ExternalInterface.call('append', "haXe problem? " + (String.fromCharCode(55296).charCodeAt(0) != 55296));
		ExternalInterface.call('append', "haXe problem? " + (String.fromCharCode(55297).charCodeAt(0) != 55297));
		//String.fromCharCode(8233);
		for(i in 0...65535) {
			var s = String.fromCharCode(i);
			// 8232 - 8233 aren't allowed in eval in FF because they are \u2028 Line separator and \u2029 Paragraph separator
			//  55296 - 56319 is 0xD800 - 0xDBFF "High Surrogate Area"
			//  56320 - 57343 is 0xDC00 - 0xDFFF "Low Surrogate Area"

			// Huh? IE doesn't seem to be having problems with the
			// surrogate area.  Maybe only Firefox/Safari?  Need to
			// either split the work, or raise Flash limit above 15
			// seconds to test Chrome and Opera.

			// Firefox 3.6b4 reports: Code is 65534 but got character with code 65533
			// Safari 4 reports: Code is 65279 but got character with code NaN
			// 65279 is U+FEFF ZERO WIDTH NO-BREAK SPACE

			if(s == '\x00' || s == '\n' || s == '\r' || s == '"' || s == "\\" || i == 8232 || i == 8233 || (i >= 55296 && i <= 57343)) {
				continue;
			} else {
				//ExternalInterface.call('append', i);
				ExternalInterface.call('(function(){giveChar('+i+', "'+s+'")})');
			}
		}
		ExternalInterface.call('doneGiving');
	}

	public static function overflow() {
		ExternalInterface.call('overflow');
	}

	public static function main() {
		ExternalInterface.addCallback("echo_raw", echo_raw);
		ExternalInterface.addCallback("send_all_chars", send_all_chars);
		ExternalInterface.addCallback("overflow", overflow);

		if (flash.Lib.current.loaderInfo.parameters.onloadcallback != null) {
			ExternalInterface.call(flash.Lib.current.loaderInfo.parameters.onloadcallback);
		}
	}
}
