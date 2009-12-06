package cw.json;

/**
 * Class containing constant values for the different types
 * of tokens in a JSON encoded string.
 */
class JSONTokenType {
	public static inline var UNKNOWN:Int = -1;
	public static inline var COMMA:Int = 0;
	public static inline var LEFT_BRACE:Int = 1;
	public static inline var RIGHT_BRACE:Int = 2;
	public static inline var LEFT_BRACKET:Int = 3;
	public static inline var RIGHT_BRACKET:Int = 4;
	public static inline var COLON:Int = 6;
	public static inline var TRUE:Int = 7;
	public static inline var FALSE:Int = 8;
	public static inline var NULL:Int = 9;
	public static inline var STRING:Int = 10;
	public static inline var NUMBER:Int = 11;
}
