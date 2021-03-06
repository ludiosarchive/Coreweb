package cw.json;

enum JSONTokenType {
	UNKNOWN;
	COMMA;
	LEFT_BRACE;
	RIGHT_BRACE;
	LEFT_BRACKET;
	RIGHT_BRACKET;
	COLON;
	TRUE;
	FALSE;
	NULL;
	STRING;
	NUMBER;
	NAN;
}

class JSONDecoder {

	private var strict:Bool;

	/** The value that will get parsed from the JSON string */
	private var value:Dynamic;

	/** The tokenizer designated to read the JSON string */
	private var tokenizer:JSONTokenizer;

	/** The current token from the tokenizer */
	private var token:JSONToken;

	/**
	 * Constructs a new JSONDecoder to parse a JSON string 
	 * into a native object.
	 *
	 * @param s The JSON string to be converted into a native object
	 */
	public inline function new(s:String, strict:Bool) {
		this.strict = strict;
		tokenizer = new JSONTokenizer(s,strict);
		nextToken();
		value = parseValue();
		if (strict && nextToken() != null) {
			tokenizer.parseError("Unexpected characters left in input stream!");
		}
	}

	/**
	 * Gets the internal object that was created by parsing
	 * the JSON string passed to the constructor.
	 *
	 * @return The internal object representation of the JSON
	 * 		string that was passed to the constructor
	 */
	public inline function getValue():Dynamic {
		return value;
	}

	/**
	 * Returns the next token from the tokenzier reading
	 * the JSON string
	 */
	private inline function nextToken():JSONToken {
		return token = tokenizer.getNextToken();
	}

	/**
	 * Attempt to parse an array
	 */
	private function parseArray():Array<Dynamic> {
		// create an array internally that we're going to attempt
		// to parse from the tokenizer
		var a:Array<Dynamic> = new Array<Dynamic>();
		// grab the next token from the tokenizer to move
		// past the opening [
		nextToken();
		// check to see if we have an empty array
		if (token.type == RIGHT_BRACKET) {
			// we're done reading the array, so return it
			return a;
		} else {
			if (!strict && token.type == JSONTokenType.COMMA) {
				nextToken();
				// check to see if we're reached the end of the array
				if (token.type == JSONTokenType.RIGHT_BRACKET) {
					return a;
				} else {
					tokenizer.parseError("Leading commas are not supported.  Expecting ']' but found " + token.value);
				}
			}
		}
		// deal with elements of the array, and use an "infinite"
		// loop because we could have any amount of elements
		while (true) {
			// read in the value and add it to the array
			a.push (parseValue());
			// after the value there should be a ] or a ,
			nextToken();
			if (token.type == RIGHT_BRACKET) {
				// we're done reading the array, so return it
				return a;
			} else if (token.type == COMMA) {
				// move past the comma and read another value
				nextToken();
				// Allow arrays to have a comma after the last element
				// if the decoder is not in strict mode
				if (!strict){
					// Reached ",]" as the end of the array, so return it
					if (token.type == JSONTokenType.RIGHT_BRACKET) {
						return a;
					}
				}
			} else {
				tokenizer.parseError("Expecting ] or , but found " + token.value);
			}
		}
		return null;
	}

	/**
	 * Attempt to parse an object
	 */
	private function parseObject():Dynamic {
		// create the object internally that we're going to
		// attempt to parse from the tokenizer
		var o:Dynamic = {};
		// store the string part of an object member so
		// that we can assign it a value in the object
		var key:String;
		// grab the next token from the tokenizer
		nextToken();
		// check to see if we have an empty object
		if (token.type == RIGHT_BRACE) {
			// we're done reading the object, so return it
			return o;
		}	// in non-strict mode an empty object is also a comma
			// followed by a right bracket
		else { 
			if (!strict && token.type == JSONTokenType.COMMA) {
				// move past the comma
				nextToken();
				// check to see if we're reached the end of the object
				if (token.type == JSONTokenType.RIGHT_BRACE) {
					return o;
				} else {
					tokenizer.parseError("Leading commas are not supported.  Expecting '}' but found " + token.value);
				}
			}
		}
		// deal with members of the object, and use an "infinite"
		// loop because we could have any amount of members
		while (true) {
			if (token.type == STRING) {
				// the string value we read is the key for the object
				key = Std.string(token.value);
				// move past the string to see what's next
				nextToken();
				// after the string there should be a :
				if (token.type == COLON) {
					// move past the : and read/assign a value for the key
					nextToken();
					Reflect.setField(o, key, parseValue());
					// move past the value to see what's next
					nextToken();
					// after the value there's either a } or a ,
					if (token.type == RIGHT_BRACE) {
						// // we're done reading the object, so return it
						return o;
					} else if (token.type == COMMA) {
						// skip past the comma and read another member
						nextToken();
					
						// Allow objects to have a comma after the last member
						// if the decoder is not in strict mode
						if (!strict) {
							// Reached ",}" as the end of the object, so return it
							if (token.type == JSONTokenType.RIGHT_BRACE) {
								return o;
							}
						}
					} else {
						tokenizer.parseError("Expecting } or , but found " + token.value);
					}
				} else {
					tokenizer.parseError("Expecting : but found " + token.value);
				}
			} else {
				tokenizer.parseError("Expecting string but found " + token.value);
			}
		}
		return null;
	}

	/**
	 * Attempt to parse a value
	 */
	private function parseValue():Dynamic {
		// Catch errors when the input stream ends abruptly
		if (token == null) {
			tokenizer.parseError("Unexpected end of input");
		}
		switch (token.type) {
			case LEFT_BRACE:
				return parseObject();
			case LEFT_BRACKET:
				return parseArray();
			case STRING:
				return token.value;
			case NUMBER:
				return token.value;
			case TRUE:
				return true;
			case FALSE:
				return false;
			case NULL:
				return null;
			case NAN:
				if (!strict) {
					return token.value;
				} else {
					tokenizer.parseError("Unexpected " + token.value);
				}
			default:
				tokenizer.parseError("Unexpected " + token.value);
		}
		return null;
	}
}
