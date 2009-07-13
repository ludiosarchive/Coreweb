from twisted.application.service import ServiceMaker

TwistedWeb = ServiceMaker(
	"Coreweb Testrun",
	"cwtools.tap",
	"A server that serves JavaScript tests",
	"cwrun"
)
