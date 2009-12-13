package cw.json;

import cw.json.JSON;
import flash.external.ExternalInterface;


/**
 * These tests come from caffeine-hx, as3corelib, json.org's Test1 and Test2, and self-written tests.
 */

class TestAll extends haxe.unit.TestCase {

	// TODO: should be in haxe.unit.TestCase or our own cw.unit.TestCase
	function fail(message:String):Void {
		currentTest.done = true;
		currentTest.success = false;
		currentTest.error = message;
		throw currentTest;
	}

	public function expectParseError(jsonString:String, strict:Bool=true):Void {
		var parseError:JSONParseError = null;
			
		try {
			var o:Dynamic = JSON.decode(jsonString, strict);
			fail("Expecting parse error but one was not thrown");
		} catch (e:JSONParseError) {
			parseError = e;
		} catch (e:Dynamic) {
			throw e;
		}

		assertTrue(parseError != null);
	}

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

	public function testDecodeStringWithInvalidUnicodeEscape():Void {
		// No characters after the u
		expectParseError('"\\u"');

		// Not a hex character after the u
		expectParseError('"\\ut"');

		// Not enough characters after the u
		expectParseError('"\\u123"');

		// Unicode decodes correctly
		assertEquals("a", JSON.decode('"\\u0061"'));
	}

	public function testDecodeZero():Void {
		var n:Dynamic = JSON.decode("0");
		assertEquals( n, 0 );
	}
		
	/**
	 * JSON doesn't allow leading zeroes for numbers.
	 */
	public function testLeadingZeroFail():Void {
		expectParseError("02");
	}

	public function testDecodePositiveInt():Void {
		var n:Dynamic = JSON.decode("123871");
		assertEquals(n, 123871);
	}
		
	public function testDecodeNegativeInt():Void {
		var n:Dynamic = JSON.decode("-97123");
		assertEquals(n, -97123);
	}
		
	public function testDecodePositiveFloat():Void {
		var n:Dynamic = JSON.decode("12.987324");
		assertEquals(n, 12.987324);
	}
		
	public function testDecodeNegativeFloat():Void {
		var n:Dynamic = JSON.decode("-1298.7324");
		assertEquals(n, -1298.7324);
	}
		
	public function testDecodeFloatLeadingZeroError():Void {
		expectParseError("-.2");
	}
		
	public function testDecodeFloatDecimalMissingError():Void {
		expectParseError("1.");
	}
		
	public function testDecodeScientificRegularExponent():Void {
		var n:Dynamic = JSON.decode("6.02e2");
		assertEquals(n, 602);
			
		n = JSON.decode("-2e10");			
		assertEquals(n, -20000000000);
		assertEquals(n, -2 * Math.pow(10, 10));
	}
		
	public function testDecodeScientificPositiveExponent():Void {
		var n:Dynamic = JSON.decode("2E+9");
		assertEquals(n, 2 * Math.pow(10, 9));
			
		n = JSON.decode("-2.2E+23");
		assertEquals(n, -2.2 * Math.pow(10, 23));
	}
		
	public function testDecodeScientificNegativeExponent():Void {
		var n:Dynamic = JSON.decode("6.02e-23");
		assertEquals(n, 6.02 * Math.pow(10, -23));
			
		n = JSON.decode("-4e-9");
		assertEquals(n, -4 * Math.pow(10, -9));
			
		n = JSON.decode("0E-2");
		assertEquals(n, 0);
	}
		
	public function testDecodeScientificExponentError():Void {
		expectParseError("1e");
	}


	/**
	 * Based on http://json.org/JSON_checker/test/pass1.json ; a better version of this test is also in simplejson
	 */
	public function testPass1() {
		// pass1_modified.json is included as a resource at compile time
		var original:String = haxe.Resource.getString("pass1_modified");

		var decoded:Array<Dynamic> = JSON.decode(original);
		// Check that something was actually decoded
		assertEquals("JSON Test Pattern pass1", decoded[0]);
		assertEquals(-42, decoded[4]);
		assertEquals(null, decoded[8].null);

		// Check that it can be encoded
		var encoded:String = JSON.encode(decoded);
		//dumpToBrowserConsole(encoded);

		// The pass1_modified used in this test is based on a newer version of pass1.json
		// than the one included in simplejson (2009-11).

		// Even if it didn't use the newer version, the cw.json encoder produces output slightly
		// longer than simplejson, because:
		//	- its float representation is sometimes non-optimal; for example: 1.23456789000000e+34
		//	- it backslashes forward slashes, leading to "wasted" bytes

		assertEquals(990, encoded.length);
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
		ExternalInterface.call('console.log('+JSON.encode(anything)+')');
	}


	// TODO: test for all the decoder exceptions, including:
		// "Number Infinity [is] not valid"

}
