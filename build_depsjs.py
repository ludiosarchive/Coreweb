#!/usr/bin/env python

from os.path import join
from coreweb._closurebuild.depsjs import write_depsjs

write_depsjs(['js_coreweb ' + join("..", "..", "..", "js_coreweb")], join("js_coreweb", "deps.js"))
