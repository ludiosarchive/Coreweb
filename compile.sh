#!/bin/zsh -e
export HAXE_LIBRARY_PATH=/usr/local/haxe/std:./hx
export HAXE_HOME=/usr/local/haxe
PATH=$PATH:$HAXE_LIBRARY_PATH:$HAXE_HOME/bin

LOG="./cwtools/exp/build_Experiments.log"
date > $LOG
echo >> $LOG
haxe -v -swf-version 9 -swf ./cwtools/exp/Experiments.swf -main cw.exp.Experiments >> $LOG
cp /med/builds/swfobject/swfobject/expressInstall.swf ./cwtools/exp/

LOG="./cwtools/exp/build_cw_json_tests.log"
date > $LOG
echo >> $LOG
haxe -v -swf ./cwtools/exp/cw_json_tests.swf -swf-version 9 -swf-header 800:600:1:F7F7F7 -main cw.json.Tests >> $LOG
