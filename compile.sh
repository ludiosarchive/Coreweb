#!/bin/zsh -e
export HAXE_LIBRARY_PATH=/usr/local/haxe/std:./hx
export HAXE_HOME=/usr/local/haxe
PATH=$PATH:$HAXE_LIBRARY_PATH:$HAXE_HOME/bin

date > ./cwtools/exp/build_Experiments.log
echo >> ./cwtools/exp/build_Experiments.log
haxe -v -swf-version 9 -swf ./cwtools/exp/Experiments.swf -main cw.exp.Experiments >> ./cwtools/exp/build_Experiments.log
cp /med/builds/swfobject/swfobject/expressInstall.swf ./cwtools/exp/

date > ./cwtools/exp/build_json.log
echo >> ./cwtools/exp/build_json.log
haxe -v -swf ./cwtools/exp/JSON.swf -swf-version 9 -swf-header 800:600:1:F7F7F7 -main cw.json.Tests >> ./cwtools/exp/build_json.log
