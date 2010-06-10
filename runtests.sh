#!/bin/zsh -e

python -N `which trial` cwtools
trial cwtools

echo
echo "Now running with the Python test runner..."
python -W all -m unittest discover
