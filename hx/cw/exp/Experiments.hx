package cw.exp;

import flash.external.ExternalInterface;

class Experiments {
	public static var sockets:Hash<String> = new Hash();

	public static function echo_raw(anything:Dynamic) {
		return anything;
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
