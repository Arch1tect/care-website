import os
import logging

# Always change directory to /server
abspath = os.path.abspath(__file__)
dname = os.path.dirname(abspath)
os.chdir(dname)

logging.basicConfig(
	format='%(asctime)s %(levelname)-8s %(message)s',
	level = logging.INFO,
	filename = '../log/log.txt'
	)

console_logger = logging.StreamHandler()
console_logger.setLevel(logging.INFO)

logging.getLogger('').addHandler(console_logger)