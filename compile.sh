#!/bin/zsh -e
export HAXE_LIBRARY_PATH=/usr/local/haxe/std:./hx
export HAXE_HOME=/usr/local/haxe
PATH=$PATH:$HAXE_LIBRARY_PATH:$HAXE_HOME/bin

LOG="./cwtools/exp/build_Experiments.log"
date > $LOG
echo >> $LOG
haxe -v -swf-version 9 -swf ./cwtools/exp/Experiments.swf -main cw.exp.Experiments >> $LOG
cp /med/builds/swfobject/swfobject/expressInstall.swf ./cwtools/exp/

LOG="./cwtools/testres/build_TestExternalInterface.log"
date > $LOG
echo >> $LOG
haxe -v -swf-version 9 -swf ./cwtools/testres/TestExternalInterface.swf -main cw.TestExternalInterface >> $LOG
cp /med/builds/swfobject/swfobject/expressInstall.swf ./cwtools/testres/

LOG="./cwtools/exp/build_cw_json_tests.log"
date > $LOG
echo >> $LOG
haxe -v -swf-version 9 -swf ./cwtools/exp/cw_json_tests.swf -resource ./hx/cw/json/pass1_modified.json@pass1_modified -swf-header 800:600:1:F7F7F7 -main cw.json.Tests >> $LOG
