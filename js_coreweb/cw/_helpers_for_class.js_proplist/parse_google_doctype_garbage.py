import sys
print open(sys.argv[1], 'rb').read().replace('*', '').replace('(', '').replace(')', '').split()
