/**
 * At some point, this actually worked. But Node.js sucks anyway (as of 2009-11).
 */

// TODO: update Node logger to use Closure Library logging. Use Closure's TextFormatter.

// TODO: Log to file? Log to stderr?
if(window.node && window.ENV && window.ENV.UNITTEST_LOGFILE) {

	CW.logger._beforeOpenedBuffer = "";

	node.fs.open(
		window.ENV.UNITTEST_LOGFILE,
		node.O_WRONLY | node.O_TRUNC | node.O_CREAT, 0644).addCallback(
			function (file) {
				CW.logger._openLogFile = file;
				node.fs.write(CW.logger._openLogFile, CW.logger._beforeOpenedBuffer, null, "utf8");
				CW.logger._beforeOpenedBuffer = null;
			}
	);

	CW.logger.addObserver(function _CW_file_log_observer(evt) {
		var prepend;
		if (evt.isError) {
			prepend = "CW error: ";
		} else {
			prepend = "CW log: ";
		}

		function appendLine(prefix, message) {
			msg = '[' + CW.localTime() + '] ' + prefix + message + '\n';
			if(CW.logger._openLogFile) {
				node.fs.write(CW.logger._openLogFile, msg, null, "utf8");
			} else {
				CW.logger._beforeOpenedBuffer += msg;
			}
		}

		appendLine(prepend, evt.message);

		if (evt.isError) {
			appendLine('', evt.error);
			if(evt.error.stack) {
				appendLine('', evt.error.stack);
			}
		}
	});
}
