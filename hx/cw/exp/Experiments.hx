package cw.exp;

import flash.external.ExternalInterface;

class Experiments {
	public static var sockets:Hash<String> = new Hash();

	public static function js2flash(anything:Dynamic) {
		return anything;
	}

	public static function main() {
		ExternalInterface.addCallback("js2flash", js2flash);

		if (flash.Lib.current.loaderInfo.parameters.onloadcallback != null) {
			ExternalInterface.call(flash.Lib.current.loaderInfo.parameters.onloadcallback);
		}
	}
}
