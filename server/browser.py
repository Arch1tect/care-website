import docker
import os

client = docker.from_env()
volume_bindings = {
					'/watchman/': {
										'bind': '/mnt/watchman',
										'mode': 'rw'
									}
				 }

def take_screenshot(url, screenshot_path, wait=None):
	'''Run docker image to take a screenshot'''
	if not wait:
		wait = 2
	print 'taking screenshot...will wait', wait, 'sec'
	program = 'python'
	script = '/mnt/watchman/server/screenshot.py'
	arguments = '{} {} {}'.format(url, screenshot_path, wait)
	cmd = "{} {} {}".format(program, script, arguments)
	docker_logs = client.containers.run("browser:latest", cmd, volumes=volume_bindings, shm_size='2G')
	# docker_logs = client.containers.run("browser:latest", cmd)

	# print "docker_logs"
	# print docker_logs

	return True