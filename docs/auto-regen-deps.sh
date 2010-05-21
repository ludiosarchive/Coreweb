#!/bin/zsh

# This script watches the (directory it is contained in) for modifications
# and runs ./regen-deps.sh when anything changes.

cd "`dirname $0`"

./regen-deps.sh
echo -n "# "
while inotifywait -q -e modify -e move -e create -r ~/Projects/*/js; do
	echo -n "# "
	./regen-deps.sh
done
