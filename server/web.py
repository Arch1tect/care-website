import time
import os
import logging

from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
import git

import setup
from cfg.credentials import db_user, db_password
from db.model import CareTask, TaskLog
from browser import take_screenshot

app = Flask(__name__)

db_url = 'chat-anywhere-mysql.cjwz9xnh80ai.us-west-1.rds.amazonaws.com/care'
connection_str = 'mysql://{}:{}@{}'.format(db_user, db_password, db_url)
app.config['SQLALCHEMY_DATABASE_URI'] = connection_str

database = SQLAlchemy(app)
session = database.session

logger = logging.getLogger(__name__)

@app.route("/api/git")
def githubUpdated():
	g = git.cmd.Git(os.getcwd())
	g.pull()
	return "succeed!"

@app.route("/api/task/<task_id>")
def get_task(task_id):
	'''return a task row from db'''
	task_logs = session.query(TaskLog).filter(TaskLog.task_id==task_id).all()
	return jsonify([t.as_dict() for t in task_logs])


@app.route("/api/task/<task_id>/roi", methods=['POST'])
def update_task_roi(task_id):

	task = session.query(CareTask).filter(CareTask.id==task_id).one()
	data = request.get_json()
	task.roi = data['roi']
	session.commit()
	return 'success!'

# TODO: api below should be POST not GET
@app.route("/api/task/<task_id>/interval/<interval>")
def update_task_interval(task_id, interval):

	task = session.query(CareTask).filter(CareTask.id==task_id).one()
	task.interval = interval
	session.commit()
	return 'success!'

# TODO: api below should be POST not GET
@app.route("/api/task/<task_id>/pause/")
def pause_task(task_id):

	task = session.query(CareTask).filter(CareTask.id==task_id).one()
	task.pause = True
	session.commit()
	return 'success!'

# TODO: api below should be POST not GET
@app.route("/api/task/<task_id>/continue/")
def continue_task(task_id):

	task = session.query(CareTask).filter(CareTask.id==task_id).one()
	task.pause = False
	session.commit()
	return 'success!'

@app.route("/api/tasks/user/<user_id>")
def get_all_tasks_for_user(user_id):
	'''return all tasks for a user'''
	# TODO: add user id filter when we support multiple users
	tasks = session.query(CareTask).all()
	tasks.reverse()
	paused_task = [t for t in tasks if t.pause]
	active_task = [t for t in tasks if not t.pause]

	return jsonify([t.as_dict() for t in (active_task+paused_task)])

@app.route("/api/task/<task_id>/screenshot")
def get_screenshot_for_task(task_id):
	'''Get screenshot of existing task, not checking changes though'''
	task = session.query(CareTask).filter(CareTask.id==task_id).one()
	screenshot_name = '{}.png'.format(time.time())
	#  Should put these in a different folder
	screenshot_path = '../screenshot/{}'.format(screenshot_name)
	if take_screenshot(task.url, screenshot_path, task.wait):
		return screenshot_name

	return 'Failed to take screenshot.', 500

@app.route("/api/task/<task_id>", methods=['DELETE'])
def delete_task(task_id):
	'''Delete a task in DB'''
	# TODO: also delete logs and images
	session.query(CareTask).filter(CareTask.id==task_id).delete()
	session.commit()
	return 'success!'

@app.route("/api/task", methods=['POST'])
def create_new_task():
	'''Create new task, also properly rename initial screenshot if exist'''
	# TODO: avoid duplicate
	data = request.get_json()
	url = correct_url(data['url'])
	logger.info('Creating new task with data {}'.format(data))
	task = CareTask(name=data.get('name'), url=url, interval=data['interval'], roi=data.get('roi'))
	session.add(task)
	session.commit()
	initial_screenshot = data.get('screenshot')
	if initial_screenshot:
		os.rename('../screenshot/{}'.format(initial_screenshot),
				  '../screenshot/{}-0.png'.format(task.id))
	return 'success!'

@app.route("/api/screenshot/url", methods=['POST'])
def take_screenshot_for_url():
	data = request.get_json()
	url = correct_url(data['url'])
	screenshot_name = '{}.png'.format(time.time())
	#  Should put these in a different folder
	screenshot_path = '../screenshot/{}'.format(screenshot_name)
	if take_screenshot(url, screenshot_path):
		return screenshot_name

	return 'Failed to take screenshot.', 500

def correct_url(url):
	if not url.startswith('http'):
		url = 'http://' + url
	return url

# TODO debug=True only for dev environment
app.run(debug=True, host='0.0.0.0', port=9000)