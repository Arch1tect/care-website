# This should only run inside docker, 
# run by python directly,
# not as a module, never need to import this file
import sys
import logging
import time

from selenium import webdriver  
from selenium.webdriver.chrome.options import Options

logger = logging.getLogger(__name__)

chrome_options = Options()  
chrome_options.add_argument("--headless")
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36")
# binary_location is optional, selenium is able to find by itself
# chrome_options.binary_location = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"  


def take_screenshot(url, screenshot_name, wait):
	# TODO: no need to save if found no change
	# https://stb-tester.com/blog/2016/09/20/add-visual-verification-to-your-selenium-tests-with-stb-tester
	driver = webdriver.Chrome(chrome_options=chrome_options)
	res = False
	# path inside container
	screenshot_path = "/mnt/watchman/screenshot/" + screenshot_name
	try:
		# logger.info('[Task {}] Loading {}'.format(task.id, task.url))
		# driver.get(task.url)

		driver.get(url)
		time.sleep(float(wait))
		width = driver.execute_script("return document.body.scrollWidth")
		height = driver.execute_script("return document.body.scrollHeight")
		if width == 0:
			width = 800
		if height  == 0:
			height = 1200
		if height > 3000:
			height = 3000
		if width < 800:
			width = 800
		# logger.info('[Task {}] Document size {},{}'.format(task.id, width, height))
		driver.set_window_size(width, height)
		# logger.info('[Task {}] Taking screenshot'.format(task.id))

		driver.save_screenshot(screenshot_path)
		# f = open(screenshot_path)
		# res = upload_to_s3(f, 'screenshot/'+screenshot_name)
		# logger.info('[Task {}] screenshot saved successfully - {}'.format(task.id, screenshot_path))
		# print "s3 upload res:"
		# print res

		res = True
	except Exception as e:
		logger.exception(e)
		print str(e)
		# logger.error('[Task {}] screenshot failed.'.format(task.id))

	driver.quit()
	return res

url = sys.argv[1]
screenshot_name = sys.argv[2]
wait = sys.argv[3]

take_screenshot(url, screenshot_name, wait)
