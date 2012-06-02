package cw;

import flash.external.ExternalInterface;

import cw.json.JSON;


class TestExternalInterface {

	public static var responsecallback:String;

	public static function echo_raw(anything:Dynamic) {
		return anything;
	}

	public static function respond_raw(anything:Dynamic) {
		ExternalInterface.call(responsecallback, anything);
	}

	/**
	 * To respond in a way that doesn't corrupt data, we must use ExternalInterface.call
	 * with our own JSON encoder.  We cannot `return' if we want to do it right.
	 */
	public static function respond_correct(anything:Dynamic) {
		ExternalInterface.call(responsecallback+'('+JSON.encode(anything)+')');
	}

	public static function main() {
		ExternalInterface.addCallback("echo_raw", echo_raw);
		ExternalInterface.addCallback("respond_raw", respond_raw);
		ExternalInterface.addCallback("respond_correct", respond_correct);

		responsecallback = flash.Lib.current.loaderInfo.parameters.responsecallback;

		if (flash.Lib.current.loaderInfo.parameters.onloadcallback != null) {
			ExternalInterface.call(flash.Lib.current.loaderInfo.parameters.onloadcallback);
		}
	}
}
