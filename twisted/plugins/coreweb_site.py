from twisted.application.service import ServiceMaker

TwistedWeb = ServiceMaker(
	"Coreweb site",
	"cwtools.tap",
	"Coreweb site with js_coreweb tests and experiments",
	"coreweb_site"
)
