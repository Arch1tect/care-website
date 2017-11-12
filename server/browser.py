import docker
import os

client = docker.from_env()
volume_bindings = {
					'/public/care-website/': {
										'bind': '/mnt/care-website',
										'mode': 'rw'
									}
				 }

def take_screenshot(url, screenshot_path, wait=None):
	'''Run docker image to take a screenshot'''
	print 'taking screenshot...'
	program = 'python'
	script = '/mnt/care-website/server/screenshot.py'
	arguments = '{} {} {}'.format(url, screenshot_path, wait)
	cmd = "{} {} {}".format(program, script, arguments)
	docker_logs = client.containers.run("care:latest", cmd, volumes=volume_bindings)

	print docker_logs

	return os.path.isfile(screenshot_path)