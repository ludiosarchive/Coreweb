package cw.json;

import cw.json.JSONDecoder;

class JSONToken {
	
	/** type of the token */
	public var type:JSONTokenType;
	/** value of the token */
	public var value:Dynamic;
	
	/**
	 * Creates a new JSONToken with a specific token type and value.
	 *
	 * @param type The JSONTokenType of the token
	 * @param value The value of the token
	 */
	public function new(?type:JSONTokenType, ?value:Dynamic=null) {
		this.type = type == null?UNKNOWN:type;
		this.value = value;
	}
}
