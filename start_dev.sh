#!/bin/sh -e
export JSPATH="$HOME/JSPATH"
export PYTHONPATH=$HOME/Projects/Coreweb
export PYRELOADING=1

looper twistd -no cwrun -p CW.Test -a tcp:9090:interface=0 -b ssl:443:privateKey=dev_keys/x.linuxwan.com-key.pem:interface=0
