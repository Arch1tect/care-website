import time
import os
import logging
import datetime

from flask import Flask, jsonify, request, session, abort
from flask_sqlalchemy import SQLAlchemy
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import git

import setup
from cfg.credentials import db_user, db_password
from db.model import CareTask, TaskLog, CareUser
from browser import take_screenshot
from plugin import check_login_session

app = Flask(__name__)
# secret key for signing cookie
app.secret_key = 'hey hey yo yo'
db_url = 'chat-anywhere-mysql.cjwz9xnh80ai.us-west-1.rds.amazonaws.com/care'
connection_str = 'mysql://{}:{}@{}'.format(db_user, db_password, db_url)
app.config['SQLALCHEMY_DATABASE_URI'] = connection_str

database = SQLAlchemy(app)
db_session = database.session

logger = logging.getLogger(__name__)

limiter = Limiter(
	app,
	key_func=get_remote_address
)

@app.route("/api/git")
def github_updated():
	gg = git.cmd.Git(os.getcwd())
	gg.pull()
	return "Succeed!"


@app.route("/api/login", methods=['POST'])
@limiter.limit("5/minute")
def login():
	data = request.get_json()
	email = data['email']
	password = data['password']
	user = db_session.query(CareUser).filter(CareUser.email==email).first()
	if not user or not user.password==password:
		abort(401, 'Wrong email or password!')
	session['user'] = user.as_dict()
	return "Logged in!"

@app.route("/api/session")
@check_login_session
def is_session_active():
	return "Session active!"

@app.route("/api/logout")
@check_login_session
def logout():
	session.pop('user', None)
	return "Logged out!"

@app.route("/api/task/<task_id>")
@limiter.limit("10/minute")
@check_login_session
def get_task(task_id):
	'''return a task and all its task logs'''
	task = db_session.query(CareTask).filter(CareTask.id==task_id).one()
	task_logs = db_session.query(TaskLog).filter(TaskLog.task_id==task_id).all()
	res = {
		'task': task.as_dict(),
		'log': [t.as_dict() for t in task_logs]
	}
	return jsonify(res)


@app.route("/api/task/<task_id>/roi", methods=['POST'])
@limiter.limit("10/minute")
@check_login_session
def update_task_roi(task_id):
	'''update roi of a task'''
	task = db_session.query(CareTask).filter(CareTask.id==task_id).one()
	data = request.get_json()
	task.roi = data['roi']
	db_session.commit()
	return 'success!'

# TODO: api below should be POST not GET
@app.route("/api/task/<task_id>/interval/<interval>")
@limiter.limit("10/minute")
@check_login_session
def update_task_interval(task_id, interval):
	'''update check interval of a task'''
	task = db_session.query(CareTask).filter(CareTask.id==task_id).one()
	task.interval = interval
	db_session.commit()
	return 'success!'

# TODO: api below should be POST not GET
@app.route("/api/task/<task_id>/pause")
@limiter.limit("10/minute")
@check_login_session
def pause_task(task_id):
	'''pause a task'''
	logger.info('Pausing task {}'.format(task_id))
	task = db_session.query(CareTask).filter(CareTask.id==task_id).one()
	task.pause = True
	db_session.commit()
	return 'success!'

# TODO: api below should be POST not GET
@app.route("/api/task/<task_id>/continue")
@limiter.limit("10/minute")
@check_login_session
def resume_task(task_id):
	'''resume a task'''
	logger.info('Resuming task {}'.format(task_id))
	task = db_session.query(CareTask).filter(CareTask.id==task_id).one()
	task.pause = False
	db_session.commit()
	return 'success!'

@app.route("/api/task/<task_id>/name", methods=['PUT'])
@limiter.limit("10/minute")
@check_login_session
def change_task_name(task_id):
	data = request.get_json()
	task = db_session.query(CareTask).filter(CareTask.id==task_id).one()
	task.name = data['name']
	db_session.commit()
	return 'success!'

@app.route("/api/tasks/user")
@limiter.limit("10/minute")
@check_login_session
def get_all_tasks_for_user():
	'''return all tasks for a user'''
	user = session['user']
	user_id = user['id']
	logger.info('Getting all tasks for user {}'.format(user_id))

	# TODO: add user id filter when we support multiple users
	tasks = db_session.query(CareTask).filter(CareTask.user_id==user_id).all()
	# tasks.reverse()
	# paused_task = [t for t in tasks if t.pause]
	# active_task = [t for t in tasks if not t.pause]

	# tasks = active_task + paused_task
	tasks = [t.as_dict() for t in tasks]
	for t in tasks:
		log_changed = db_session.query(TaskLog).order_by(TaskLog.id.desc()).filter(TaskLog.changed == True, TaskLog.task_id==t['id']).first()
		if log_changed:
			t['log_changed'] = log_changed.as_dict()

	tasks.sort(key=sort_users_tasks)
	tasks.reverse()

	return jsonify(tasks)


def sort_users_tasks(task):
	'''
	Paused tasks should be shown last
	Task with recent last change show first
	Task just created show first
	'''

	if task['pause']:
		return datetime.datetime(1970,1,1)
	if 'log_changed' in task:
		return task['log_changed']['timestamp']

	return task['created']


@app.route("/api/task/<task_id>/screenshot")
@limiter.limit("1/minute")
@check_login_session
def get_screenshot_for_task(task_id):
	'''Get screenshot of existing task, not checking changes though'''
	task = db_session.query(CareTask).filter(CareTask.id==task_id).one()
	screenshot_name = '{}.png'.format(time.time())
	#  Should put these in a different folder
	screenshot_path = '../screenshot/{}'.format(screenshot_name)
	if take_screenshot(task.url, screenshot_path, task.wait):
		return screenshot_name

	return 'Failed to take screenshot.', 500

@app.route("/api/task/<task_id>", methods=['DELETE'])
@limiter.limit("10/minute")
@check_login_session
def delete_task(task_id):
	'''Delete a task in DB'''
	# TODO: also delete logs and images
	db_session.query(CareTask).filter(CareTask.id==task_id).delete()
	db_session.commit()
	return 'success!'

@app.route("/api/task", methods=['POST'])
@limiter.limit("10/minute")
def create_new_task():
	'''Create new task, also properly rename initial screenshot if exist'''
	# TODO: user id should be in the path, if logged in
	data = request.get_json()
	logger.info('Creating new task with data {}'.format(data))
	url = correct_url(data['url'])
	email = data['email']
	if not email:
		raise Exception('Email is empty when creating task!')
	user = db_session.query(CareUser).filter(CareUser.email==email).first()
	if not user:
		user = CareUser(email=email, password='123', join_date=datetime.datetime.utcnow())
		db_session.add(user)
		db_session.commit()
		# TODO: Send welcome/confirmation email

	task = CareTask(user_id=user.id, name=data.get('name'), url=url, interval=data['interval'], roi=data.get('roi'))
	db_session.add(task)
	db_session.commit()

	check_log = TaskLog(task_id=task.id, run_id=0, timestamp=datetime.datetime.utcnow(), success=True)
	db_session.add(check_log)
	db_session.commit()

	initial_screenshot = data.get('screenshot')
	if initial_screenshot:
		os.rename('../screenshot/{}'.format(initial_screenshot),
				  '../screenshot/{}-0.png'.format(task.id))
	return 'success!'

@app.route("/api/screenshot/url", methods=['POST'])
@limiter.limit("5/minute")
def take_screenshot_for_url():
	'''Take screenshot before creating new task'''
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
if __name__ == "__main__":
	app.run(debug=True, host='0.0.0.0', port=9000)