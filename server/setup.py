import os
import sys
import logging
from logging.handlers import TimedRotatingFileHandler

# Always change directory to /server
# Still need this for saving screenshot in relative folder
# Better change it!
abspath = os.path.abspath(__file__)
dname = os.path.dirname(abspath)
os.chdir(dname)


log_file = '/var/log/watchman/log.txt'
root_logger = logging.getLogger('')
root_logger.setLevel(logging.INFO)
# Create formatter and add it to both handlers
formatter = logging.Formatter(
	'%(asctime)s - %(name)s - %(levelname)s - %(message)s')


# Write to screen
console_log_handler = logging.StreamHandler(stream=sys.stdout)
console_log_handler.setLevel(logging.INFO)
console_log_handler.setFormatter(formatter)

# Write to log file, rotate every day
rotating_log_handler = TimedRotatingFileHandler(log_file, when='midnight')
rotating_log_handler.setLevel(logging.INFO)
rotating_log_handler.setFormatter(formatter)


logging.getLogger('').addHandler(console_log_handler)
logging.getLogger('').addHandler(rotating_log_handler)
