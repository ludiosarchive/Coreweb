#!/bin/zsh -e
export HAXE_LIBRARY_PATH=/usr/local/haxe/std:hxJson2
export HAXE_HOME=/usr/local/haxe
PATH=$PATH:$HAXE_LIBRARY_PATH:$HAXE_HOME/bin
haxe -v -swf test9.swf -swf-version 9 -swf-header 800:600:1:F7F7F7 -main hxjson2.Tests > ./build.log
