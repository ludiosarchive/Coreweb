#!/usr/bin/env python

from coreweb._closurebuild.compiler import compile

import build_depsjs

compile(
	 roots=["js_coreweb"]
	,namespaces=["cw.tabnexus_worker"]
	,output="coreweb/compiled/tabnexus_worker.js"
	,output_log="coreweb/compiled/tabnexus_worker.js.log"
)
