# This should be run inside docker, don't import this file
import sys
import logging
import time

from selenium import webdriver  
from selenium.webdriver.chrome.options import Options

logger = logging.getLogger(__name__)

chrome_options = Options()  
chrome_options.add_argument("--headless")
chrome_options.add_argument("--no-sandbox")
# binary_location is optional, selenium is able to find by itself
# chrome_options.binary_location = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"  


def take_screenshot(url, screenshot_path, wait=None):
	# TODO: no need to save if found no change
	# https://stb-tester.com/blog/2016/09/20/add-visual-verification-to-your-selenium-tests-with-stb-tester
	driver = webdriver.Chrome(chrome_options=chrome_options)
	res = False
	try:
		# logger.info('[Task {}] Loading {}'.format(task.id, task.url))
		# driver.get(task.url)
		driver.get(url)
		width = driver.execute_script("return document.body.scrollWidth")
		height = driver.execute_script("return document.body.scrollHeight")
		if width == 0:
			width = 800
		if height  == 0:
			height = 1200
		if height > 3000:
			height = 3000
		# logger.info('[Task {}] Document size {},{}'.format(task.id, width, height))
		driver.set_window_size(width, height)
		if (wait):
			driver.implicitly_wait(wait)
		# logger.info('[Task {}] Taking screenshot'.format(task.id))

		driver.save_screenshot(screenshot_path)

		# logger.info('[Task {}] screenshot saved successfully - {}'.format(task.id, screenshot_path))
		res = True
	except Exception as e:
		logger.exception(e)
		print str(e)
		# logger.error('[Task {}] screenshot failed.'.format(task.id))

	driver.quit()
	return res

url = sys.argv[1]
screenshot_path = '/mnt/care-website/screenshot/' + sys.argv[2]
wait = sys.argv[3]

take_screenshot(url, screenshot_path, wait)