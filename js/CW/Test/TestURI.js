// import CW.URI


CW.UnitTest.TestCase.subclass(CW.Test.TestURI, 'functionalTests').methods(

	function test_urisplit(self) {

		self.assertEqual(
			CW.URI.urisplit(
			"scheme://authority/path?query#fragment"),
			['scheme', 'authority', '/path', 'query', 'fragment'])

		self.assertEqual(
			CW.URI.urisplit(
			"scheme://authority/path?query#"),
			['scheme', 'authority', '/path', 'query', ''])

		self.assertEqual(
			CW.URI.urisplit(
			"scheme://authority/path?query"),
			['scheme', 'authority', '/path', 'query', null])

		self.assertEqual(
			CW.URI.urisplit(
			"scheme://authority/path?"),
			['scheme', 'authority', '/path', '', null])

		self.assertEqual(
			CW.URI.urisplit(
			"scheme://authority/path??"),
			['scheme', 'authority', '/path', '?', null])

		self.assertEqual(
			CW.URI.urisplit("scheme://authority/path#?"),
			['scheme', 'authority', '/path', null, '?'])

		self.assertEqual(
			CW.URI.urisplit("scheme://authority/path#?#"),
			['scheme', 'authority', '/path', null, '?#'])

		self.assertEqual(
			CW.URI.urisplit(
			"scheme://authority/path"),
			['scheme', 'authority', '/path', null, null])

		self.assertEqual(
			CW.URI.urisplit(
			"scheme://authority/"),
			['scheme', 'authority', '/', null, null])

		self.assertEqual(
			CW.URI.urisplit(
			"scheme://authority"),
			['scheme', 'authority', '', null, null])

		self.assertEqual(
			CW.URI.urisplit(
			"scheme://"),
			['scheme', '', '', null, null])

		// No authority is okay, too

		self.assertEqual(
			CW.URI.urisplit(
			"scheme:path"),
			['scheme', null, 'path', null, null])

		self.assertEqual(
			CW.URI.urisplit(
			"scheme:/path"),
			['scheme', null, '/path', null, null])

		// L{urisplit} automatically lowercases the scheme:

		self.assertEqual(
			CW.URI.urisplit(
			"SCHEME://authority"),
			['scheme', 'authority', '', null, null])

		self.assertEqual(
			CW.URI.urisplit(
			"sChEmE://authority"),
			['scheme', 'authority', '', null, null])

		// It is reversable:

		self.assertEqual(
			CW.URI.uriunsplit.apply(this, CW.URI.urisplit(
			"scheme://authority")),
			'scheme://authority')

		self.assertEqual(
			CW.URI.uriunsplit.apply(this, CW.URI.urisplit(
			"scheme://authority/")),
			'scheme://authority/')

	},

	function test_uriunsplit(self) {
		self.assertEqual(
			CW.URI.uriunsplit(
			'scheme', 'authority', '/path', 'query', 'fragment'),
			'scheme://authority/path?query#fragment');

		self.assertEqual(
			CW.URI.uriunsplit(
			'scheme', 'authority', '/path', null, 'fragment'),
			'scheme://authority/path#fragment');

		self.assertEqual(
			CW.URI.uriunsplit(
			'scheme', 'authority', '/path', '', 'fragment'),
			'scheme://authority/path?#fragment');

		self.assertEqual(
			CW.URI.uriunsplit(
			'scheme', 'authority', '/path', '?', '?'),
			'scheme://authority/path??#?');

		self.assertEqual(
			CW.URI.uriunsplit(
			'scheme', 'authority', '/path', '', null),
			'scheme://authority/path?');

		self.assertEqual(
			CW.URI.uriunsplit(
			'scheme', 'authority', '/path', '', ''),
			'scheme://authority/path?#');

		self.assertEqual(
			CW.URI.uriunsplit(
			'scheme', null, 'path', '', ''),
			'scheme:path?#');
	},

	function test_split_authority(self) {
		self.assertEqual(
			CW.URI.split_authority(
			"user:password@host:1"),
			['user', 'password', 'host', '1']);

		// No host, but a port? Ugly.
		self.assertEqual(
			CW.URI.split_authority(
			"user:password@:1"),
			['user', 'password', '', '1']);

		self.assertEqual(
			CW.URI.split_authority(
			"user@host:1"),
			['user', null, 'host', '1']);

		self.assertEqual(
			CW.URI.split_authority(
			"user:@host:999"),
			['user', '', 'host', '999']);

		self.assertEqual(
			CW.URI.split_authority(
			":@host:1000000"),
			['', '', 'host', '1000000']);
	},

	function test_join_authority(self) {
		self.assertEqual('user:password@host:90', CW.URI.join_authority('user', 'password', 'host', '90'));
		self.assertEqual('user:@host:90', CW.URI.join_authority('user', '', 'host', '90'));
		self.assertEqual('user:@:90', CW.URI.join_authority('user', '', '', '90'));
		self.assertEqual('user:@:', CW.URI.join_authority('user', '', '', ''));
		self.assertEqual('user@host:90', CW.URI.join_authority('user', null, 'host', '90'));
		self.assertEqual('host:90', CW.URI.join_authority(null, 'password', 'host', '90'));
		self.assertEqual(':password@host:90', CW.URI.join_authority('', 'password', 'host', '90'));
		self.assertEqual(':@host:90', CW.URI.join_authority('', '', 'host', '90'));
		self.assertEqual(':@host:0', CW.URI.join_authority('', '', 'host', '0'));
		self.assertEqual(':@host:-2', CW.URI.join_authority('', '', 'host', '-2')); // eh
		self.assertEqual(':@host', CW.URI.join_authority('', '', 'host', null));
		self.assertEqual('host', CW.URI.join_authority(null, null, 'host', null));
	}
);


CW.UnitTest.TestCase.subclass(CW.Test.TestURI, 'URLTests').methods(

	function test_fullURL(self) {
		var URL = CW.URI.URL;
		var u = URL("scheme://user:password@host:81/path?query#fragment");

		self.assertEqual('scheme', u.scheme);
		self.assertEqual('user', u.user);
		self.assertEqual('password', u.password);
		self.assertEqual('host', u.host);
		self.assertEqual(81, u.port);
		self.assertEqual('/path', u.path);
		self.assertEqual('query', u.query);
		self.assertEqual('fragment', u.fragment);

		self.assertEqual("scheme://user:password@host:81/path?query#fragment", u.getString());
		self.assertEqual('CW.URI.URL("scheme://user:password@host:81/path?query#fragment")', u.toString());
	},


	function test_changeSchemeStrangePort(self) {
		var URL = CW.URI.URL;
		var u = URL("http://user:pass@domain:81/path?query#fragment");
		self.assertEqual("http://user:pass@domain:81/path?query#fragment", u.getString());

		u.scheme = "HTTPS";
		self.assertEqual("https://user:pass@domain:81/path?query#fragment", u.getString());
	},


	function test_changeSchemeExplicitPort1(self) {
		var URL = CW.URI.URL;
		var u = URL("http://user:pass@domain/path?query#fragment");
		self.assertEqual("http://user:pass@domain/path?query#fragment", u.getString());

		u.update('port', 80);
		u.update('scheme', 'HTTPS');

		self.assertEqual("https://user:pass@domain:80/path?query#fragment", u.getString());
	},


	function test_changeSchemeExplicitPort2(self) {
		var URL = CW.URI.URL;
		var u = URL("http://user:pass@domain/path?query#fragment");
		self.assertEqual("http://user:pass@domain/path?query#fragment", u.getString());

		u.update('scheme', 'HTTPS');
		u.update('port', 80);

		self.assertEqual("https://user:pass@domain:80/path?query#fragment", u.getString());
	},


	/**
	 * If a port is ever explicitly given in a parsed string, or a port is every explicitly
	 * set, cloning the URL means it's tainted with the 'explicit port set' bit
	 */
	function test_portMeansTaintedForever(self) {
		var URL = CW.URI.URL;
		var u = URL("http://user:pass@domain/path?query#fragment");
		self.assertEqual("http://user:pass@domain/path?query#fragment", u.getString());

		u.update('port', 80);
		var u2 = URL(u);
		u2.update('scheme', 'https');

		self.assertEqual("https://user:pass@domain:80/path?query#fragment", u.getString());
	},


	function test_changeSchemeDefaultPort(self) {
		var URL = CW.URI.URL;
		var u = URL("http://user:pass@domain/path?query#fragment");
		self.assertEqual("http://user:pass@domain/path?query#fragment", u.getString());
		self.assertEqual(80, u.port);

		// to https
		u.update(scheme, "HTTPS");
		self.assertEqual("https://user:pass@domain/path?query#fragment", u.getString());
		self.assertEqual(443, u.port);

		// ...and back to http
		u.update(scheme, "htTP");
		self.assertEqual("http://user:pass@domain/path?query#fragment", u.getString());
		self.assertEqual(80, u.port);
	}

//
//	function test_changePort(self) {
//		var u;
//		var URL = CW.URI.URL;
//		u = URL("http://user:pass@domain:81/path?query#fragment");
//		self.assertEqual("http://user:pass@domain:81/path?query#fragment", u.getString());
//		self.assertEqual('CW.URI.URL("http://user:pass@domain:81/path?query#fragment")', u.toString());
//	}
);
