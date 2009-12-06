package cw.json;

class JSONParseError {

	/** The location in the string where the error occurred */
	private var _location:Int;
	/** The string in which the parse error occurred */
	private var _text:String;
	private var name:String;
	public var text(gettext, null):String;
	public var location(getlocation, null):Int;
	private var message:String;

	/**
	 * Constructs a new JSONParseError.
	 *
	 * @param message The error message that occured during parsing
	 */
	public inline function new(message:String="", location:Int=0, text:String="") {
		//super( message );
		name = "JSONParseError";
		_location = location;
		_text = text;
		this.message = message;
	}

	/**
	 * Provides read-only access to the location variable.
	 *
	 * @return The location in the string where the error occurred
	 */
	public inline function getlocation():Int {
		return _location;
	}

	/**
	 * Provides read-only access to the text variable.
	 *
	 * @return The string in which the error occurred
	 */
	public inline function gettext():String {
		return _text;
	}

	public inline function toString():String {
		return name + ": " + message + " at position: " + _location + ' near "' + _text + '"';
	}
}
