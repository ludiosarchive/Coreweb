package cw.json;

#if neko
import neko.Utf8;
#elseif php
import php.Utf8;
#end

//import flash.utils.describeType;

class JSONEncoder {

	/** The string that is going to represent the object we're encoding */
	private var jsonString:String;
	
	/**
	 * Creates a new JSONEncoder.
	 *
	 * @param o The object to encode as a JSON string
	 */
	public function new(value:Dynamic) {
		jsonString = convertToString(value);
	}
	
	/**
	 * Gets the JSON string from the encoder.
	 *
	 * @return The JSON string representation of the object
	 * 		that was passed to the constructor
	 */
	public inline function getString():String {
		return jsonString;
	}
	
	/**
	 * Converts a value to it's JSON string equivalent.
	 *
	 * @param value The value to convert.  Could be any 
	 *		type (object, number, array, etc)
	 */
	private function convertToString(value:Dynamic):String {
		// Convert a List or IntHash into an Array
		if (Std.is(value, List) || Std.is(value, IntHash)) {
			value = Lambda.array(value);
		}
		// Convert a Hash into an Object
		if (Std.is(value, Hash)) {
			value = mapHash(value);
		}
		
		if (Std.is(value, String)) {
			return escapeString(Std.string(value));
		} else if (Std.is(value, Float)) {
			return Math.isFinite(value) ? Std.string(value) : "null";
		} else if (Std.is(value, Bool)) {
			return value ? "true" : "false";
		} else if (Std.is(value, Array)) {
			return arrayToString(cast(value,Array<Dynamic>));
		} else if (Std.is(value, Dynamic) && value != null) {
			return objectToString(value);
		}
		return "null";
	}
	
	private inline function mapHash(value:Hash<Dynamic>):Dynamic {
		var ret:Dynamic = {};
		for (i in value.keys()) {
			Reflect.setField(ret, i, value.get(i));
		}
		return ret;
	}
	
	/**
	 * Escapes a string accoding to the JSON specification.
	 *
	 * @param str The string to be escaped
	 * @return The string with escaped special characters
	 * 		according to the JSON specification
	 */
	private inline function escapeString(str:String):String {
		var s:String = '"';
		// current character in the string we're processing
		var ch:String;
		// store the length in a local variable to reduce lookups
		var len:Int = str.length;
		#if neko
		var utf8mode = (Utf8.length(str) != str.length);
		if (utf8mode)
			len = Utf8.length(str);
		#elseif php
		var utf8mode = (Utf8.length(str) != str.length);
		if (utf8mode)
			len = Utf8.length(str);
		#end
		for (i in 0...len) {
			ch = str.charAt(i);
			#if neko
			if (utf8mode) {
				ch = Utf8.sub(str, i, 1);
			}
			#elseif php
			if (utf8mode) {
				ch = Utf8.sub(str, i, 1);
			}
			#end
			switch (ch) {
				case '"':
					s += "\\\"";
				case '\\':
					s += "\\\\";
				case '\n':
					s += "\\n";
				case '\r':
					s += "\\r";
				case '\t':
					s += "\\t";
				case '\x08':
					s += "\\b";
				case '\x0C':
					s += "\\f";
				case '/': // Match the behavior of goog.json precisely, for HTML safety.
					s += "\\/";
				default:
					var code = ch.charCodeAt(0);
					#if neko
					if (utf8mode)
						code = Utf8.charCodeAt(str, i);
					#elseif php
					if (utf8mode)
						code = Utf8.charCodeAt(str, i);
					#end
					if (ch < ' ' || code >= 127) {
						#if neko
						var hexCode:String = StringTools.hex(Utf8.charCodeAt(str, i), 4);
						#elseif php
						var hexCode:String = StringTools.hex(Utf8.charCodeAt(str, i), 4);
						#else
						var hexCode:String = StringTools.hex(ch.charCodeAt(0), 4);
						#end
						s += "\\u";
						s += hexCode;
					} else {
						// just pass-through
						s += ch;
					}
			}
		}
		s += '"';
		return s;
	}
	
	/**
	 * Converts an array to it's JSON string equivalent
	 *
	 * @param a The array to convert
	 * @return The JSON string representation of <code>a</code>
	 */
	private inline function arrayToString(a:Array<Dynamic>):String {
		var s:String = '[';
		for (i in 0...a.length) {
			if (s.length > 1) {
				s += ",";
			}
			s += convertToString(a[i]);
		}
		
		// KNOWN ISSUE:  In ActionScript, Arrays can also be associative
		// objects and you can put anything in them, ie:
		//		myArray["foo"] = "bar";
		//
		// These properties aren't picked up in the for loop above because
		// the properties don't correspond to indexes.  However, we're
		// sort of out luck because the JSON specification doesn't allow
		// these types of array properties.
		//
		// So, if the array was also used as an associative object, there
		// may be some values in the array that don't get properly encoded.
		//
		// A possible solution is to instead encode the Array as an Object
		// but then it won't get decoded correctly (and won't be an
		// Array instance)

		// close the array and return it's string value
		s += ']';
		return s;
	}
	
	/**
	 * Converts an object to it's JSON string equivalent
	 *
	 * @param o The object to convert
	 * @return The JSON string representation of <code>o</code>
	 */
	private inline function objectToString(o:Dynamic):String {
		var s:String = '{';
		var value:Dynamic;
		for (key in Reflect.fields(o)) {
			// assign value to a variable for quick lookup
			value = Reflect.field(o, key);
			// don't add functions to the JSON string
			if (!Reflect.isFunction(value))	{
				if (s.length > 1) {
					s += ",";
				}
				s += escapeString(key);
				s += ":";
				s += convertToString(value);
			}
		}
		s += '}';
		return s;
	}
}
