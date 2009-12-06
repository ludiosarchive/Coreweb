package cw.json;

import cw.json.JSON;
import flash.external.ExternalInterface;


/**
 * These tests come from caffeine-hx, as3corelib, json.org's Test1 and Test2, and self-written tests.
 */

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
		var v = [[], {}, 0, -0.5, 0.5, 2E100, 2E-100, false, true, null, ""];
		var e = JSON.encode(v);
		assertEquals('[[],{},0,-0.5,0.5,2e+100,2e-100,false,true,null,""]', e);
		var d:Array<Dynamic> = JSON.decode(e);
		assertEquals(0, d[0].length);
		// skip object in d[1]
		assertEquals(0, d[2]);
		assertEquals(-0.5, d[3]);
		assertEquals(0.5, d[4]);
		// if we do assertEquals(2.0E100, d[5]); or similar, haXe barfs with:
		// expected '2e+100' but was '2.00000000000000e+100'               // (zeroes might be of incorrect quantity)
		assertTrue(d[5] > 2E99);
		assertTrue(d[6] < 2E-99);
		assertEquals(false, d[7]);
		assertEquals(true, d[8]);
		assertEquals(null, d[9]);
		assertEquals("", d[10]);
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
		var o = {x: {y: 1}};
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
		var o = {x:[5,10, {y:[0,1,2,3,4]},1.32,1000,0.0001]};
		var e = JSON.encode(o);
		var d = JSON.decode(e);
		assertEquals(3, d.x[2].y[3]);
	}

	public function testQuoted() {
		var o = {msg: 'hello world\"s'};
		var e = JSON.encode(o);
		var d = JSON.decode(e);
		assertEquals(d.msg, o.msg);
	}

	public function testNewLine() {
		var o = {msg: 'hello\nworld\nhola el mundo'};
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

	/**
	 * From http://json.org/JSON_checker/test/pass1.json ; a better version of this test is also in simplejson
	 */
	public function testPass1() {
		// After pasting the text from http://json.org/JSON_checker/test/pass1.json ,
		// backslashes were doubled, and single quotes were backslashed (because this string is contained in a ' ')
		//	sigh... if only haXe had literal strings
		
		// Removed         "":  23456789012E666,
		//	because it was raising exception "Number Infinity [is] not valid"
		
		var original:String = '
[
    "JSON Test Pattern pass1",
    {"object with 1 member":["array with 1 element"]},
    {},
    [],
    -42,
    true,
    false,
    null,
    {
        "integer": 1234567890,
        "real": -9876.543210,
        "e": 0.123456789e-12,
        "E": 1.234567890E+34,
        "zero": 0,
        "one": 1,
        "space": " ",
        "quote": "\\"",
        "backslash": "\\\\",
        "controls": "\\b\\f\\n\\r\\t",
        "slash": "/ & \\/",
        "alpha": "abcdefghijklmnopqrstuvwyz",
        "ALPHA": "ABCDEFGHIJKLMNOPQRSTUVWYZ",
        "digit": "0123456789",
        "special": "`1~!@#$%^&*()_+-={\':[,]}|;.</>?",
        "hex": "\\u0123\\u4567\\u89AB\\uCDEF\\uabcd\\uef4A",
        "true": true,
        "false": false,
        "null": null,
        "array":[  ],
        "object":{  },
        "address": "50 St. James Street",
        "url": "http://www.JSON.org/",
        "comment": "// /* <!-- --",
        "# -- --> */": " ",
        " s p a c e d " :[1,2 , 3

,

4 , 5        ,          6           ,7        ],
        "compact": [1,2,3,4,5,6,7],
        "jsontext": "{\\"object with 1 member\\":[\\"array with 1 element\\"]}",
        "quotes": "&#34; \\u0022 %22 0x22 034 &#x22;",
        "\\/\\\\\\"\\uCAFE\\uBABE\\uAB98\\uFCDE\\ubcda\\uef4A\\b\\f\\n\\r\\t`1~!@#$%^&*()_+-=[]{}|;:\',./<>?"
: "A key can be any string"
    },
    0.5 ,98.6
,
99.44
,

1066


,"rosebud"]';

		var decoded:Array<Dynamic> = JSON.decode(original);
		// Check that something was actually decoded
		assertEquals("JSON Test Pattern pass1", decoded[0]);
		assertEquals(-42, decoded[4]);
		assertEquals(null, decoded[8].null);

		// Check that it can be encoded
		var encoded:String = JSON.encode(decoded);
		//dumpToBrowserConsole(encoded);

		// This version is slightly longer than the simplejson-encoded version,
		// because:
			// its floatrepresentation is sometimes non-optimal; for example: 1.23456789000000e+34
			// it backslashes slashes, leading to "wasted" bytes

		assertEquals(954, encoded.length); // Expect 936 from simplejson.dumps with separators=(',', ':')
	}


	public function testNesting32() {
		// json's test2 requires minimum nesting capability of 20, we'll require 32
		var original:Dynamic = [[[[[[[[[[[[[[[[[[[[[[[[[[[[[[["Not too deep"]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]];
		var encoded:String = JSON.encode(original);
		assertEquals('[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[["Not too deep"]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]', encoded);
		var decoded:String = JSON.decode(encoded);
		assertEquals(original, decoded);
	}


	public function dumpToBrowserConsole(anything:Dynamic) {
		ExternalInterface.call('(function(){console.log('+JSON.encode(anything)+')})');
	}


	// TODO: test for all the decoder exceptions, including:
		// "Number Infinity [is] not valid"

}
