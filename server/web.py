import time
import os
import logging

from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy

import setup
from cfg.credentials import db_user, db_password
from db.model import CareTask
from browser import take_screenshot

app = Flask(__name__)

db_url = 'chat-anywhere-mysql.cjwz9xnh80ai.us-west-1.rds.amazonaws.com/care'
connection_str = 'mysql://{}:{}@{}'.format(db_user, db_password, db_url)
app.config['SQLALCHEMY_DATABASE_URI'] = connection_str

database = SQLAlchemy(app)
session = database.session

logger = logging.getLogger(__name__)


@app.route("/api/task/<task_id>")
def get_task(task_id):
	'''return a task row from db'''

	task = session.query(CareTask).filter(CareTask.id==task_id).one()
	return jsonify(task.as_dict())

@app.route("/api/tasks/user/<user_id>")
def get_all_tasks_for_user(user_id):
	'''return all tasks for a user'''
	# TODO: add user id filter when we support multiple users
	tasks = session.query(CareTask).all()
	return jsonify([t.as_dict() for t in tasks])

@app.route("/api/task/<task_id>/screenshot")
def get_screenshot_for_task(task_id):
	'''Get screenshot of existing task, not used now'''
	task = session.query(CareTask).filter(CareTask.id==task_id).one()
	new_screenshot_name = '{}-{}.png'.format(task.id, task.last_run_id + 1)
	new_screenshot_path = '../screenshot/{}'.format(new_screenshot_name)
	if take_screenshot(task.url, new_screenshot_path):
		return send_file(new_screenshot_path, mimetype='image/png')
	return 'Failed to take screenshot.'

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
	return 'success'

@app.route("/api/screenshot/url", methods=['POST'])
def take_screenshot_for_url():
	data = request.get_json()
	url = correct_url(data['url'])
	# task = CareTask(id=0, name='new', url=url)
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