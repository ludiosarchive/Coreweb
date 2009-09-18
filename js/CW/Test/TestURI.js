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
			CW.URI.split_authority("user:password@host:1"),
			['user', 'password', 'host', 1]);

		self.assertEqual(
			CW.URI.split_authority("user@host:1"),
			['user', null, 'host', 1]);

		self.assertEqual(
			CW.URI.split_authority("user:@host:999"),
			['user', '', 'host', 999]);

		self.assertEqual(
			CW.URI.split_authority(":@host:1000000"),
			['', '', 'host', 1000000]);
	},

	function test_join_authority(self) {
		self.assertEqual('user:password@host:90', CW.URI.join_authority('user', 'password', 'host', 90));
		self.assertEqual('user:@host:90', CW.URI.join_authority('user', '', 'host', 90));
		self.assertEqual('user@host:90', CW.URI.join_authority('user', null, 'host', 90));
		self.assertEqual('host:90', CW.URI.join_authority(null, 'password', 'host', 90));
		self.assertEqual(':password@host:90', CW.URI.join_authority('', 'password', 'host', 90));
		self.assertEqual(':@host:90', CW.URI.join_authority('', '', 'host', 90));
		self.assertEqual(':@host:0', CW.URI.join_authority('', '', 'host', 0));
		self.assertEqual(':@host:-2', CW.URI.join_authority('', '', 'host', -2)); // eh
		self.assertEqual(':@host', CW.URI.join_authority('', '', 'host', null));
		self.assertEqual('host', CW.URI.join_authority(null, null, 'host', null));
	}
);


CW.UnitTest.TestCase.subclass(CW.Test.TestURI, 'URLTests').methods(
	function test_URL(self) {

	}
);
