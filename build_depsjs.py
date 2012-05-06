#!/usr/bin/env python

from __future__ import with_statement

import os
import sys
from subprocess import Popen, PIPE

join = os.path.join

CLOSURE_LIBRARY_HOME = os.environ.get("CLOSURE_LIBRARY_HOME", join("..", "closure-library"))

def write_deps(roots_with_prefix, output):
	args = [
		 sys.executable
		,join(CLOSURE_LIBRARY_HOME, "closure", "bin", "build", "depswriter.py")
	]
	for rwp in roots_with_prefix:
		args.append('--root_with_prefix=' + rwp)

	proc = Popen(args, stdout=PIPE)
	stdout = proc.communicate()[0]
	if proc.returncode == 0:
		with open(output, "wb") as deps_file:
			deps_file.write(stdout.replace("\r\n", "\n"))
	else:
		raise RuntimeError("Got return code %r from depswriter.py" % (proc.returncode))


def main():
	write_deps(['js_coreweb ' + join("..", "..", "..", "js_coreweb")], join("js_coreweb", "deps.js"))


if __name__ == '__main__':
	main()
