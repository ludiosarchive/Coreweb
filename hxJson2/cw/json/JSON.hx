package cw.json;

class JSON {

	/**
	 * Encodes a object into a JSON string.
	 *
	 * @param o The object to create a JSON string for
	 * @return the JSON string representing o
	 */
	public static inline function encode(o:Dynamic):String {
		return new JSONEncoder(o).getString();
	}
	
	/**
	 * Decodes a JSON string into a native object.
	 * 
	 * @param s The JSON string representing the object
	 * @return A native object as specified by s
	 */
	public static inline function decode(s:String, strict:Bool=true):Dynamic {
		return new JSONDecoder(s,strict).getValue();
	}

}
