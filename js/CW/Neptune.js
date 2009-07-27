//CW.Neptune.Constants = {
//	 WAITING_NEXT: 1
//	,STILL_READING: 2
//};

CW.Class.subclass(CW.Neptune, "XHRStream").methods(

	function __init__(self) {
		self.xhr = new XMLHttpRequest();

		self._cleanup();
		self.connect();
	},


	function _safeSet(self, k, v) {
		try {
			self.xhr.setRequestHeader(k, v);
		} catch(e) {}
	},


	function _removeManyHeaders(self) {
		self._safeSet("User-Agent", null);
		self._safeSet("Accept", null);
		self._safeSet("Accept-Language", null);
		self._safeSet("Accept-Charset", null);
		self._safeSet("Accept-Encoding", null);
		self._safeSet("Cache-Control", null);
		//self._safeSet("Pragma", "");
		//self._safeSet("Referer", "");
		//self._safeSet("Keep-Alive", null);

		// If we use " " instead of a letter, FF sends "; charset=UTF-8"
		// which *might* cause problems with proxies/AV.
		self._safeSet("Content-Type", "N");

		// Why would mibbit do this?
		// Browser decides if connections are kept alive. We could be operating over HTTP 1.0.
//		self.safeSet("Connection", "keep-alive");
//		self.safeSet("Keep-Alive", null);
	},


	function connect(self) {
		self.xhr.open('POST', '/xhrstream/?nodelay?' + CW.random(), true);
		//self.xhr.overrideMimeType('text/plain; charset=utf-8');
		self._removeManyHeaders();
		self.xhr.onprogress = function(ev1) {
			// doesn't appear to log anything in FF3
			console.log('ev1', ev1);
		};
		self.xhr.onreadystatechange = function(ev) {
			/* We'll be getting onreadystatechange'ed even if we can't read
			 * the entire unicode character yet. (only one octet came down the wire)
			 *
			 * (confirmed in FF 3.0.7 Windows)
			 */

			/* Can we somehow get the amount of bytes we've received without accessing
			 * the .responseText property?
			 * (which cycles an insane amount of memory in FF2/3, maybe others)
			 *
			 * No, it doesn't look like it.
			 *
			 * [NO] So, what we'll do:
			 *    when we know that we're getting a large block of data, and
			 *    we know that the 'state 3' event will trigger every 4096 bytes,
			 *    we can ignore a certain amount of those.
			 *
			 *    as a backup, we can set a timer to check responseText just like we tried to for Opera.
			 *
			 * Actually, above is a bad idea. Hard to predict how much data we're really getting,
			 * and ~4096 pattern doesn't appear in Chrome at all.
			 *
			 * So, the strategy will be to avoid using the persistent XHR stream for big blocks of data
			 * that need to be pulled from the remote.
			 */

			console.log('ev', ev);

			var state = 0.0 + self.xhr.readyState;
			if(state == 3 || state == 4) {
				self._dataReceived();
			}
//			if(state == 3 || state == 4) {
//				__CW_print(self.xhr.responseText.length+'<br>');
//			}
//			if(state == 4) {
//				self._dataReceived();
//			}
			if(state == 4) {
				self._cleanup();
			}
		}

		// Even though Opera only sends 1 onreadystatechange readyState 3 event,
		// this allows for XHR streaming in Opera, by trying to read from responseText anyway.

		/*
		 * Why the strange Opera 10 bug? It stops updating after message 118.
		 * This is because after Opera 10 gets ~16384 bytes, it decides to buffer everything,
		 * until the next 2*(16384) checkpoint, then 2*2*16384, and so on.
		 */

		if(window.opera) {
			self.forceReadInterval = setInterval(function(){self._dataReceived.apply(self, []);},50);
		}
		self.connStatus = "maybealive";
		self.xhr.send('');
	},


	function _cleanup(self) {
		self.connStatus = "done";
		if(self.forceReadInterval !== undefined) {
			clearInterval(self.forceReadInterval);
			self.forceReadInterval = undefined;
		}
		self.lastLengthSeen = 0; // for debugging only. comment out soon.
		self.uniPosition = 0;
		self.minimumLengthToCare = 0;
		self.lastHeaders = null;
	},

	/* Firefox 2 problem:

	FF2 only decodes from UTF-8 -> unicode after the response is completely done.

	 */

	function _dataReceived(self) {
		var responseLengthNow = 0.0 + self.xhr.responseText.length;

		__CW_print(responseLengthNow+'<br>');

		//console.log('responseText.length increased by', responseLengthNow-self.lastLengthSeen);
		var lengthIncrease = responseLengthNow-self.lastLengthSeen;
		__CW_print("Increase: " + lengthIncrease + "<br>");
		self.lastLengthSeen = responseLengthNow;
		//__CW_print(Array(lengthIncrease+1).join('.'));

		if(self.connStatus !== "maybealive") {
			__CW_print("self.connStatus was " + self.connStatus + ", so return;");
			return;
		}

		if(self.lastHeaders == null) {
			self.lastHeaders = self.xhr.getAllResponseHeaders();
			__CW_print(CW.JSON.stringify(self.lastHeaders));
		}

		if(responseLengthNow < self.minimumLengthToCare) {
			return;
		}
		/*
		 * TODO: find out if browsers will drop event 3 if JS is busy processing things.
		 * This could impact our design, because we'll have to treat the xhr object
		 * as an ever-morphing thing, rather than getting its length at the top and using that.
		 */

		/*
		 * Parse as many message as possible.
		 *
		 * Never substr anything unless we're sure it'll give us a full message,
		 * because we don't want to the waste browser memory on half-finished messages.
		 */
		while (1) {
			// responseText could grow in this while loop, and that's OK.

			// this was tried for FF2 but it doesn't seem to fix
			//var code = (''+self.xhr.responseText).substr(self.uniPosition, 1).charCodeAt(0);
			var code = self.xhr.responseText.charCodeAt(self.uniPosition);

			//__CW_print('char is' + CW.JSON.stringify(self.xhr.responseText.substr(self.uniPosition, 1)) + 'code is ' + code + '<br>');
			if(isNaN(code)) {
				throw new Error("No code yet? We should never see this message.");
			}

			// We've got a new code...

			var messageLength = code + 1; // because when we send code 0, we mean it has length 1

			self.minimumLengthToCare = self.uniPosition + 1 + messageLength; // 1 + because code takes up space too
			if(responseLengthNow < self.minimumLengthToCare) {
				break;
			}

			// + 1 because we need to skip past the code
			var completeMessage = self.xhr.responseText.substr(self.uniPosition + 1, messageLength);

			try {
				self.messageReceived(completeMessage);
			} catch(e) {
				CW.msg("Failed to process message, but the show must go on.");
			}

			self.uniPosition += (1 + messageLength); // 1 + because the code takes up space too

			self.minimumLengthToCare = self.uniPosition + 1; // + 1 because we'll need at least a code to continue processing anything

			if(responseLengthNow < self.minimumLengthToCare) {
				break;
				// break out to the avoid the isNaN code
				// (we never want to process more than our preserved length variable allows)
			}
		}

		//__CW_print(CW.JSON.stringify(self.xhr.responseText) + '<br>');
		//self.uniPosition = self.xhr.responseText.length; // can't do this. it could have already changed.
	},


	function messageReceived(self, message) {
		//__CW_print("got a message.<br>");
		__CW_print(message + '<br>');
		//__CW_print(+new Date + " " + CW.JSON.stringify(eval('(' + message + ')')) + '<br>');
	}
);

