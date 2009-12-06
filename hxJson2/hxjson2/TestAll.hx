package hxjson2;

import hxjson2.JSON;

class X {
	var a : Int;
	var b : String;

	public function new() {
		a = 42;
		b = "foobar";
	}
}

class TestAll extends haxe.unit.TestCase {

	public function testSimple() {
		var v = {x:"nice", y:"one"};
		var e = JSON.encode(v);
		assertEquals('{"x":"nice","y":"one"}', e);
		var d = JSON.decode(e);
		assertEquals(d.y, v.y);
		assertEquals(d.x, v.x);
	}

	public function testNumVal() {
		var v = {x:2};
		var e = JSON.encode(v);
		assertEquals('{"x":2}', e);
		var d = JSON.decode(e);
		assertEquals(d.x, v.x);
	}

	public function testStrVal() {
		var v = {y: "blackdog"};
		var e = JSON.encode(v);
		assertEquals('{"y":"blackdog"}', e);
		var d = JSON.decode(e);
		assertEquals("blackdog", d.y);
	}

	public function testEncodeMiscValues() {
		var v = [[], {}, 0, -0.5, 0.5, false, true, null];
		var e = JSON.encode(v);
		assertEquals('[[],{},0,-0.5,0.5,false,true,null]', e);
		var d:Array<Dynamic> = JSON.decode(e);
		assertEquals(0, d[0].length);
		// skip object
		assertEquals(0, d[2]);
		assertEquals(-0.5, d[3]);
		assertEquals(0.5, d[4]);
		assertEquals(false, d[5]);
		assertEquals(true, d[6]);
		assertEquals(null, d[7]);
	}

	public function testWords() {
		var p:Dynamic = JSON.decode('{"y":null}');
		assertEquals(null, p.y);

		 p = JSON.decode('{"y":true}');
		assertEquals(true, p.y);

		 p = JSON.decode('{"y":false}');
		assertEquals(false, p.y);
	}

	public function testStrArray() {
		var a = ["black","dog","is","wired"];
		var e = JSON.encode(a);
		var d = JSON.decode(e);
		var i = 0;
		while (i < a.length) {
			assertEquals(d[i], a[i]);
			i++;
		}
	}

	public function testNumArray() {
		var a = [5,10,400000,1.32];
		var e = JSON.encode(a);
		var d = JSON.decode(e);
		var i = 0;
		while (i < a.length) {
			assertEquals(d[i], a[i]);
			i++;
		}
	}

	public function testObjectObject() {
		var o = {x: {y:1} } ;
		var e = JSON.encode(o);
		var d = JSON.decode(e);
		assertEquals(1, d.x.y);
	}

	public function testObjectArray() {
		var o = {x:[5,10,400000,1.32,1000,0.0001]};
		var e = JSON.encode(o);
		var d = JSON.decode(e);
		var i = 0;
		while (i < o.x.length) {
			assertEquals(d.x[i], o.x[i]);
			i++;
		}
	}

	public function testObjectArrayObject() {
		var o = {x:[5,10,{y:4},1.32,1000,0.0001]};
		var e = JSON.encode(o);
		var d = JSON.decode(e);
		assertEquals(4, d.x[2].y);
	}


	public function testObjectArrayObjectArray() {
		var o = {x:[5,10, {y:[0,1,2,3,4]},1.32,1000,0.0001]} ;
		var e = JSON.encode(o);
		var d = JSON.decode(e);
		assertEquals(3, d.x[2].y[3]);
	}

	public function testQuoted() {
		var o = {msg:'hello world\"s'};
		var e = JSON.encode(o);
		var d = JSON.decode(e);
		assertEquals(d.msg, o.msg);
	}

	public function testNewLine() {
		var o = {msg:'hello\nworld\nhola el mundo'};
		var e = JSON.encode(o);
		var d = JSON.decode(e);
		assertEquals(d.msg, o.msg);
	}

	public function testABitMoreComplicated() {
		var o = '{"resultset":[{"link":"/vvvv/hhhhhhh.pl?report=/opt/apache/gggg/tmp/gggg_JYak2WWn_2-3.blastz&num=30&db=GEvo_JYak2WWn.sqlite","color":"0x69CDCD","features":{"3":[289,30,297,40],"2":[633,30,637,50]},"annotation":"
Match: 460
Length: 590
Identity: 82.10
E_val: N/A"}]}';

		var d = JSON.decode(o);

		var resultset:Array<Dynamic> = d.resultset;

		var features = resultset[0].features;
		var fld2 = Reflect.field(features, "2");
		assertEquals(633, fld2[0]);

		//trace(resultset[0].annotation);
		// trace(resultset[0].features);

	}

	public function testList() {
		var o = new List<{name:String, age:Int}>() ;
		o.add({name:"blackdog", age:41});

		var e:Dynamic = JSON.encode(o);
		//trace("encoded:"+e);
		var d:Dynamic = JSON.decode(e);
		//trace("decoded:"+d);
		assertEquals(d[0].name, o.first().name);
	}

	public function testShortEscapes() {
		var original:String = "\n\r\t\x08\x0C\x0B"; // Last 3 characters are \b, \f, \v
		var encoded:String = JSON.encode(original);
		assertEquals('"\\n\\r\\t\\b\\f\\u000B"', encoded);
		var decoded:String = JSON.decode(encoded);
		assertEquals(original, decoded);
	}

	public function testLongEscapes() {
		var original:String = "\x00\x01\x0F\x10\x1F ~\x7F\x80\xFF"; // 0, 1, 15, 16, 31, 32 (space), 126 (~), 127, 128, 255
		original += String.fromCharCode(256); // 0x100
		original += String.fromCharCode(4095); // 0x0FFF
		original += String.fromCharCode(4096); // 0x1000
		original += String.fromCharCode(65535); // 0xFFFF
		var encoded:String = JSON.encode(original);
		assertEquals('"\\u0000\\u0001\\u000F\\u0010\\u001F ~\\u007F\\u0080\\u00FF\\u0100\\u0FFF\\u1000\\uFFFF"', encoded);
		var decoded:String = JSON.decode(encoded);
		assertEquals(original, decoded);
	}

	/**
	 * We backslash slashes because goog.json does it. Decoder should decode them properly too.
	 */
	public function testSlashesBackslashed() {
		var original:String = "hello/there//";
		var encoded:String = JSON.encode(original);
		assertEquals('"hello\\/there\\/\\/"', encoded);
		var decoded:String = JSON.decode(encoded);
		assertEquals(original, decoded);
	}

/*
	public function testObjectEncoding() {
		//var v = { x : "f", y: 3};
		var v = new X();

		var encoded_text = JSON.encode(v);
		trace("Encoded as " + encoded_text);

		var decoded_text : Dynamic = JSON.decode(encoded_text);
		trace("Decoded as " + decoded_text);
		trace(Std.string(decoded_text));

	}
//	*/
}
