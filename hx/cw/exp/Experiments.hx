package cw.exp;

import flash.external.ExternalInterface;

class Experiments {
	public static var sockets:Hash<String> = new Hash();

	/**
	 * Apparently, you don't need to be backslashing when you're synchronously
	 * returning objects to JavaScript (objects arrive just fine).
	 * But if you are doing ExternalInterface.call, you really need to do the backslashing.
	 *
	 * TODO: confirm that it's just not just a problem with string literals inside the Flash; construct some strings using charCode or whatever 
	 */
	public static function echo_raw(anything:Dynamic) {
		ExternalInterface.call('fromFlash', anything);
		return 'Hello\tthe"re';
		//return anything;
		//ExternalInterface.call('fromFlash', "Hello\\tWorld");
	}

	public static function overflow() {
		ExternalInterface.call('overflow');
	}

	public static function main() {
		ExternalInterface.addCallback("echo_raw", echo_raw);
		ExternalInterface.addCallback("overflow", overflow);

		if (flash.Lib.current.loaderInfo.parameters.onloadcallback != null) {
			ExternalInterface.call(flash.Lib.current.loaderInfo.parameters.onloadcallback);
		}
	}
}
