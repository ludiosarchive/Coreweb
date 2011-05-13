#!/bin/sh -e

./build_depsjs.sh

COMMON="../closure-library/closure/bin/build/closurebuilder.py \
--output_mode=compiled \
--compiler_jar=../closure-compiler/build/compiler.jar \
--compiler_flags=--compilation_level=ADVANCED_OPTIMIZATIONS \
--compiler_flags=--warning_level=VERBOSE \
--compiler_flags=--formatting=PRETTY_PRINT \
--compiler_flags=--jscomp_warning=missingProperties \
--compiler_flags=--jscomp_warning=undefinedVars \
--compiler_flags=--jscomp_warning=checkTypes \
--compiler_flags=--output_wrapper=(function(){%output%})(); \
--compiler_flags=--summary_detail_level=3 \
--root=../closure-library \
--root=js_coreweb \
--compiler_flags=--js=../closure-library/closure/goog/deps.js \
--compiler_flags=--js=../closure-library/third_party/closure/goog/deps.js \
--compiler_flags=--js=js_coreweb/deps.js \
"

$COMMON \
--namespace="cw.tabnexus_worker" \
--output_file=coreweb/compiled/tabnexus_worker.js \
2>&1 | tee coreweb/compiled/tabnexus_worker.js.log
