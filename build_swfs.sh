#!/bin/sh -e

haxe -cp hx -v -swf-version 9 -swf \
./coreweb/exp/Experiments.swf \
-main cw.exp.Experiments \
> ./coreweb/exp/Experiments.swf.log

haxe -cp hx -v -swf-version 9 -swf \
./coreweb/testres/TestExternalInterface.swf \
-main cw.TestExternalInterface \
> ./coreweb/testres/TestExternalInterface.swf.log

haxe -cp hx -v -swf-version 9 -swf \
./coreweb/exp/cw_json_tests.swf \
-resource ./hx/cw/json/pass1_modified.json@pass1_modified \
-swf-header 800:600:1:F7F7F7 \
-main cw.json.Tests \
> ./coreweb/exp/cw_json_tests.swf.log
