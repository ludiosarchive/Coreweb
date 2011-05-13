#!/bin/sh -e
export JSPATH="$HOME/JSPATH"
export PYTHONPATH=$HOME/Projects/Coreweb:$HOME/Projects/Webmagic:$HOME/Projects/Ecmaster
export PYRELOADING=1
export INTERFACE="192.168.213.133"

echo "Using `which twistd`"

looper python -N \
-W all \
-W 'ignore:Not importing directory' \
-W 'ignore:the sets module is deprecated' \
`which twistd` -n coreweb_site \
-h tcp:9090:interface=$INTERFACE \
-h ssl:443:privateKey=dev_keys/x.linuxwan.com-key.pem:interface=$INTERFACE \
