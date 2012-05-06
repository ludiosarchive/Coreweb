#!/usr/bin/env python

from coreweb._closurebuild.depsjs import write_depsjs

write_depsjs(['js_coreweb ../../../js_coreweb'], "js_coreweb/deps.js")
