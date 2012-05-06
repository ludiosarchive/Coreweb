#!/usr/bin/env python

from __future__ import with_statement

import os
import sys
import shlex
import pprint
from subprocess import Popen, PIPE, STDOUT

join = os.path.join

CLOSURE_LIBRARY_HOME = os.environ.get("CLOSURE_LIBRARY_HOME", join("..", "closure-library"))
CLOSURE_COMPILER_HOME = os.environ.get("CLOSURE_COMPILER_HOME", join("..", "closure-compiler"))
try:
	# Warning: on Windows, do not put any backslashes in your CLOSURE_COMPILER_JAVA.
	CLOSURE_COMPILER_JAVA = shlex.split(os.environ["CLOSURE_COMPILER_JAVA"])
except KeyError:
	CLOSURE_COMPILER_JAVA = [
		"nice", "-n", "10",
		"java", "-XX:+TieredCompilation", "-XX:+UseFastAccessorMethods", "-XX:+OptimizeStringConcat",
		"-cp", join(CLOSURE_COMPILER_HOME, "build", "compiler.jar")
	]


def get_svn_rev(d):
	if os.path.exists(os.path.join(d, ".git")):
		command = 'git log --max-count=200 | grep -m 1 "git-svn-id: " | cut -d " " -f 6 | cut -d "@" -f 2'
	else:
		command = 'svnversion'
	return Popen(command, cwd=d, shell=True, stdout=PIPE).communicate()[0].strip()


def get_git_rev(d):
	command = 'git log --max-count=1 --pretty=format:"%H | %ad | %s" --date=short'
	return Popen(command, cwd=d, shell=True, stdout=PIPE).communicate()[0].strip()


COMPILER_FLAGS = [
	 "--compilation_level=ADVANCED_OPTIMIZATIONS"
	,"--warning_level=VERBOSE"
	,"--formatting=PRETTY_PRINT"
	,"--jscomp_warning=missingProperties"
	,"--jscomp_warning=undefinedVars"
	,"--jscomp_warning=checkTypes"
	,"--summary_detail_level=3"
	,"--js=" + join(CLOSURE_LIBRARY_HOME, "closure", "goog", "deps.js")
	,"--js=" + join(CLOSURE_LIBRARY_HOME, "third_party", "closure", "goog", "deps.js")
]


def output_wrapper(s):
	return '(function() {\n%s})();\n' % (s,)


def get_js_list(roots, namespaces):
	assert not isinstance(roots, basestring), "must be a list, not string"
	assert not isinstance(namespaces, basestring), "must be a list, not string"

	closurebuilder = join(CLOSURE_LIBRARY_HOME, "closure", "bin", "build", "closurebuilder.py")
	args = [sys.executable, closurebuilder]
	for root in [CLOSURE_LIBRARY_HOME] + roots:
		args.append("--root=" + root)
	for namespace in namespaces:
		args.append("--namespace=" + namespace)

	proc = Popen(args, stdout=PIPE, stdin=PIPE, stderr=PIPE)
	stdout, stderr = proc.communicate()
	if proc.returncode != 0:
		print stderr
		raise RuntimeError("Got exit code %r from closurebuilder.py" % (proc.returncode,))
	return stdout.splitlines()


def get_deps_list(roots):
	return [join(root, "deps.js") for root in roots]


def compile(roots, namespaces, output, output_log, externs=[], defines={}):
	print "Compiling %r" % (output,)

	fileArgs = ["--js=" + fname for fname in get_deps_list(roots) + get_js_list(roots, namespaces)]
	moreArgs = \
		["--define=" + k + "=" + v for (k, v) in defines.iteritems()] + \
		["--externs=" + e for e in externs]
	main = "com.google.javascript.jscomp.CommandLineRunner"
	loggedArgs = COMPILER_FLAGS + moreArgs + fileArgs
	args = CLOSURE_COMPILER_JAVA + [main] + loggedArgs
	pprint.pprint(args)

	proc = Popen(args, stdout=PIPE, stdin=PIPE, stderr=PIPE)
	stdout, stderr = proc.communicate()
	if proc.returncode != 0:
		print stderr
		raise RuntimeError("Got exit code %r from Closure Compiler" % (proc.returncode,))

	with open(output, "wb") as output_file:
		output_file.write(output_wrapper(stdout))

	with open(output_log, "wb") as output_log_file:
		output_log_file.write("Compiling with the following arguments: " + repr(loggedArgs) + "\n")
		output_log_file.write(stderr.replace("\r\n", "\n"))
		output_log_file.write("Used closure-compiler r" + get_svn_rev(CLOSURE_COMPILER_HOME) + "\n")
		output_log_file.write("Used closure-library r" + get_svn_rev(CLOSURE_LIBRARY_HOME) + "\n")


def main():
	import build_depsjs
	build_depsjs.main()

	compile(
		 roots=[CLOSURE_LIBRARY_HOME, "js_coreweb"]
		,namespaces=["cw.tabnexus_worker"]
		,output="coreweb/compiled/tabnexus_worker.js"
		,output_log="coreweb/compiled/tabnexus_worker.js.log"
	)


if __name__ == '__main__':
	main()
