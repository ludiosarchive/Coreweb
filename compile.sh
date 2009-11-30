#!/bin/zsh -e
export HAXE_LIBRARY_PATH=/usr/local/haxe/std:./hx
export HAXE_HOME=/usr/local/haxe
PATH=$PATH:$HAXE_LIBRARY_PATH:$HAXE_HOME/bin
cp /med/builds/swfobject/swfobject/expressInstall.swf ./cwtools/exp/
haxe -v -swf-version 9 -swf ./cwtools/exp/Experiments.swf -main cw.exp.Experiments > ./cwtools/exp/build_Experiments.log
