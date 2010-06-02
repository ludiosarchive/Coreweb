/**
 * @fileoverview Tests for cw.uri
 */

goog.provide('cw.Test.TestURI');

goog.require('cw.UnitTest');
goog.require('cw.repr')
goog.require('cw.uri');


// anti-clobbering for JScript; aliases
(function(){

var repr = cw.repr.repr;

cw.UnitTest.TestCase.subclass(cw.Test.TestURI, 'functionalTests').methods(

	function test_urisplit(self) {

		self.assertEqual(
			cw.uri.urisplit(
			"scheme://authority/path?query#fragment"),
			['scheme', 'authority', '/path', 'query', 'fragment'])

		self.assertEqual(
			cw.uri.urisplit(
			"scheme://authority/path?query#"),
			['scheme', 'authority', '/path', 'query', ''])

		self.assertEqual(
			cw.uri.urisplit(
			"scheme://authority/path?query"),
			['scheme', 'authority', '/path', 'query', null])

		self.assertEqual(
			cw.uri.urisplit(
			"scheme://authority/path?"),
			['scheme', 'authority', '/path', '', null])

		self.assertEqual(
			cw.uri.urisplit(
			"scheme://authority/path??"),
			['scheme', 'authority', '/path', '?', null])

		self.assertEqual(
			cw.uri.urisplit("scheme://authority/path#?"),
			['scheme', 'authority', '/path', null, '?'])

		self.assertEqual(
			cw.uri.urisplit("scheme://authority/path#?#"),
			['scheme', 'authority', '/path', null, '?#'])

		self.assertEqual(
			cw.uri.urisplit(
			"scheme://authority/path"),
			['scheme', 'authority', '/path', null, null])

		self.assertEqual(
			cw.uri.urisplit(
			"scheme://authority/"),
			['scheme', 'authority', '/', null, null])

		self.assertEqual(
			cw.uri.urisplit(
			"scheme://authority"),
			['scheme', 'authority', '', null, null])

		self.assertEqual(
			cw.uri.urisplit(
			"scheme://"),
			['scheme', '', '', null, null])

		// No authority is okay, too

		self.assertEqual(
			cw.uri.urisplit(
			"scheme:path"),
			['scheme', null, 'path', null, null])

		self.assertEqual(
			cw.uri.urisplit(
			"scheme:/path"),
			['scheme', null, '/path', null, null])

		// L{urisplit} automatically lowercases the scheme:

		self.assertEqual(
			cw.uri.urisplit(
			"SCHEME://authority"),
			['scheme', 'authority', '', null, null])

		self.assertEqual(
			cw.uri.urisplit(
			"sChEmE://authority"),
			['scheme', 'authority', '', null, null])

		// It is reversable:

		self.assertEqual(
			cw.uri.uriunsplit.apply(this, cw.uri.urisplit(
			"scheme://authority")),
			'scheme://authority')

		self.assertEqual(
			cw.uri.uriunsplit.apply(this, cw.uri.urisplit(
			"scheme://authority/")),
			'scheme://authority/')

	},

	function test_uriunsplit(self) {
		self.assertEqual(
			cw.uri.uriunsplit(
			'scheme', 'authority', '/path', 'query', 'fragment'),
			'scheme://authority/path?query#fragment');

		self.assertEqual(
			cw.uri.uriunsplit(
			'scheme', 'authority', '/path', null, 'fragment'),
			'scheme://authority/path#fragment');

		self.assertEqual(
			cw.uri.uriunsplit(
			'scheme', 'authority', '/path', '', 'fragment'),
			'scheme://authority/path?#fragment');

		self.assertEqual(
			cw.uri.uriunsplit(
			'scheme', 'authority', '/path', '?', '?'),
			'scheme://authority/path??#?');

		self.assertEqual(
			cw.uri.uriunsplit(
			'scheme', 'authority', '/path', '', null),
			'scheme://authority/path?');

		self.assertEqual(
			cw.uri.uriunsplit(
			'scheme', 'authority', '/path', '', ''),
			'scheme://authority/path?#');

		self.assertEqual(
			cw.uri.uriunsplit(
			'scheme', null, 'path', '', ''),
			'scheme:path?#');
	},

	function test_splitAuthority(self) {
		self.assertEqual(
			cw.uri.splitAuthority(
			"user:password@host:1"),
			['user', 'password', 'host', '1']);

		// No host, but a port? Ugly.
		self.assertEqual(
			cw.uri.splitAuthority(
			"user:password@:1"),
			['user', 'password', '', '1']);

		self.assertEqual(
			cw.uri.splitAuthority(
			"user@host:1"),
			['user', null, 'host', '1']);

		self.assertEqual(
			cw.uri.splitAuthority(
			"user:@host:999"),
			['user', '', 'host', '999']);

		self.assertEqual(
			cw.uri.splitAuthority(
			":@host:1000000"),
			['', '', 'host', '1000000']);
	},

	function test_joinAuthority(self) {
		self.assertEqual('user:password@host:90', cw.uri.joinAuthority('user', 'password', 'host', '90'));
		self.assertEqual('user:@host:90', cw.uri.joinAuthority('user', '', 'host', '90'));
		self.assertEqual('user:@:90', cw.uri.joinAuthority('user', '', '', '90'));
		self.assertEqual('user:@:', cw.uri.joinAuthority('user', '', '', ''));
		self.assertEqual('user@host:90', cw.uri.joinAuthority('user', null, 'host', '90'));
		self.assertEqual('host:90', cw.uri.joinAuthority(null, 'password', 'host', '90'));
		self.assertEqual(':password@host:90', cw.uri.joinAuthority('', 'password', 'host', '90'));
		self.assertEqual(':@host:90', cw.uri.joinAuthority('', '', 'host', '90'));
		self.assertEqual(':@host:0', cw.uri.joinAuthority('', '', 'host', '0'));
		self.assertEqual(':@host:-2', cw.uri.joinAuthority('', '', 'host', '-2')); // eh
		self.assertEqual(':@host', cw.uri.joinAuthority('', '', 'host', null));
		self.assertEqual('host', cw.uri.joinAuthority(null, null, 'host', null));
	}
);


cw.UnitTest.TestCase.subclass(cw.Test.TestURI, 'URLTests').methods(

	function test_fullURL(self) {
		var URL = cw.uri.URL;
		var u = new URL("scheme://user:password@host:81/path?query#fragment");

		self.assertEqual('scheme', u.scheme);
		self.assertEqual('user', u.user);
		self.assertEqual('password', u.password);
		self.assertEqual('host', u.host);
		self.assertEqual(81, u.port);
		self.assertEqual('/path', u.path);
		self.assertEqual('query', u.query);
		self.assertEqual('fragment', u.fragment);

		self.assertEqual("scheme://user:password@host:81/path?query#fragment", u.toString());
		self.assertEqual('cw.uri.URL("scheme://user:password@host:81/path?query#fragment")', repr(u));
	},


	function test_fullURLDefaults(self) {
		var URL = cw.uri.URL;
		var u = new URL("https://host");

		self.assertEqual('https', u.scheme);
		self.assertEqual(null, u.user);
		self.assertEqual(null, u.password);
		self.assertEqual('host', u.host);
		self.assertEqual(443, u.port);
		self.assertEqual('/', u.path);
		self.assertEqual(null, u.query);
		self.assertEqual(null, u.fragment);

		self.assertEqual("https://host/", u.toString());
		self.assertEqual('cw.uri.URL("https://host/")', repr(u));
	},


	function test_changeEverything(self) {
		var URL = cw.uri.URL;
		var u = new URL("https://host");
		self.assertEqual("https://host/", u.toString());

		u.setUrlProperty('scheme', 'http');
		u.setUrlProperty('host', 'newhost');
		u.setUrlProperty('port', 1);
		u.setUrlProperty('user', 'auser')
		// no password set.
		u.setUrlProperty('path', '/newpath');
		u.setUrlProperty('fragment', 'fragment');
		u.setUrlProperty('query', 'aquery?yes');
		self.assertEqual("http://auser@newhost:1/newpath?aquery?yes#fragment", u.toString());

		// and back...
		u.setUrlProperty('query', null);
		u.setUrlProperty('fragment', null);
		u.setUrlProperty('path', null);
		u.setUrlProperty('user', null);
		u.setUrlProperty('port', 443);
		u.setUrlProperty('host', 'host');
		u.setUrlProperty('scheme', 'https');
		self.assertEqual("https://host/", u.toString());
	},

	/**
	 * A URL with no authority or no host throws an Error.
	 */
	function test_noAuthorityOrHost(self) {
		var URL = cw.uri.URL;

		self.assertThrows(Error, function() {
			new URL("scheme:///path?query#fragment"); });

		self.assertThrows(Error, function() {
			new URL("scheme://:81/path?query#fragment"); });
	},

	/**
	 * .update calls can be chained
	 */
	function test_fluentInterface(self) {
		var URL = cw.uri.URL;
		var u = new URL("https://host");
		u.setUrlProperty('host', 'newhost').setUrlProperty('scheme', 'http');
		self.assertEqual("http://newhost/", u.toString());
	}
);



cw.UnitTest.TestCase.subclass(cw.Test.TestURI, 'PortSchemeSwitchingTests').methods(

	function test_fullURLDefaultsUnknownScheme(self) {
		var URL = cw.uri.URL;
		var u = new URL("asdfq://host");

		self.assertEqual('asdfq', u.scheme);
		self.assertEqual(null, u.user);
		self.assertEqual(null, u.password);
		self.assertEqual('host', u.host);
		self.assertEqual(null, u.port);
		self.assertEqual('/', u.path);
		self.assertEqual(null, u.query);
		self.assertEqual(null, u.fragment);

		self.assertEqual("asdfq://host/", u.toString());
		self.assertEqual('cw.uri.URL("asdfq://host/")', repr(u));
	},


	function test_changeSchemeStrangePort(self) {
		var URL = cw.uri.URL;
		var u = new URL("http://user:pass@domain:81/path?query#fragment");
		self.assertEqual("http://user:pass@domain:81/path?query#fragment", u.toString());

		u.setUrlProperty('scheme', 'HTTPS');
		self.assertEqual("https://user:pass@domain:81/path?query#fragment", u.toString());
	},


	function test_changeSchemeExplicitPort1(self) {
		var URL = cw.uri.URL;
		var u = new URL("http://user:pass@domain/path?query#fragment");
		self.assertEqual("http://user:pass@domain/path?query#fragment", u.toString());

		u.setUrlProperty('port', 80);
		u.setUrlProperty('scheme', 'HTTPS');

		self.assertEqual("https://user:pass@domain:80/path?query#fragment", u.toString());
	},


	function test_changeSchemeExplicitPort2(self) {
		var URL = cw.uri.URL;
		var u = new URL("http://user:pass@domain/path?query#fragment");
		self.assertEqual("http://user:pass@domain/path?query#fragment", u.toString());

		u.setUrlProperty('scheme', 'HTTPS');
		u.setUrlProperty('port', 80);

		self.assertEqual("https://user:pass@domain:80/path?query#fragment", u.toString());
	},


	/**
	 * If a port is ever explicitly given in a parsed string, or a port is every explicitly
	 * set, cloning the URL means it's tainted with the 'explicit port set' bit
	 */
	function test_portMeansTaintedForever(self) {
		var URL = cw.uri.URL;
		var u = new URL("http://user:pass@domain/path?query#fragment");
		self.assertEqual("http://user:pass@domain/path?query#fragment", u.toString());

		u.setUrlProperty('port', 80);
		var u2 = new URL(u);
		u2.setUrlProperty('scheme', 'https');

		self.assertEqual("https://user:pass@domain:80/path?query#fragment", u2.toString());
	},


	function test_changeSchemeDefaultPort(self) {
		var URL = cw.uri.URL;
		var u = new URL("http://user:pass@domain/path?query#fragment");
		self.assertEqual("http://user:pass@domain/path?query#fragment", u.toString());
		self.assertEqual(80, u.port);

		// to https
		u.setUrlProperty('scheme', "HTTPS");
		self.assertEqual("https://user:pass@domain/path?query#fragment", u.toString());
		self.assertEqual(443, u.port);

		// ...and back to http
		u.setUrlProperty('scheme', "htTP");
		self.assertEqual("http://user:pass@domain/path?query#fragment", u.toString());
		self.assertEqual(80, u.port);
	},


	function test_changePortForKnownScheme(self) {
		var URL = cw.uri.URL;
		var u = new URL("http://user:pass@domain:81/path?query#fragment");
		u.setUrlProperty('port', 80);
		self.assertEqual("http://user:pass@domain/path?query#fragment", u.toString());
	},


	function test_changePortForUnknownScheme(self) {
		var URL = cw.uri.URL;
		var u = new URL("asdfq://user:pass@domain/path?query#fragment");
		self.assertEqual(null, u.port);

		u.setUrlProperty('port', 80);
		self.assertEqual(80, u.port);
		self.assertEqual("asdfq://user:pass@domain:80/path?query#fragment", u.toString());

		// Now go http
		u.setUrlProperty('scheme', 'http');
		self.assertEqual(80, u.port);
		self.assertEqual("http://user:pass@domain/path?query#fragment", u.toString());

		// Now go https
		u.setUrlProperty('scheme', 'https');
		self.assertEqual(80, u.port);
		self.assertEqual("https://user:pass@domain:80/path?query#fragment", u.toString());
	},


	/**
	 * Even though 80 is the default port for HTTP, constructing it with the port
	 * in the string means the port number is tainted, and will remain the same
	 * after changing the scheme.
	 */
	function test_changeSchemeAfterExplicitPortInStringConstruction(self) {
		var URL = cw.uri.URL;
		var u = new URL("http://user:pass@domain:80/path?query#fragment");
		self.assertEqual(80, u.port);

		u.setUrlProperty('scheme', 'https');
		self.assertEqual(80, u.port);
	}
);

})(); // end anti-clobbering for JScript
