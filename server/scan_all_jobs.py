# -*- coding: utf-8 -*-
import os
import logging
from datetime import datetime
import requests

import setup
from db.model import CareTask, TaskLog, CareUser
from db_session import session
from browser import take_screenshot
from image_diff import compare_img
from mailgun import notify_change
from s3 import upload_to_s3

logger = logging.getLogger(__name__)

def send_email_to_user(t, diff_img_path, diff_img_name):
	logger.info('[Task {}] Notify change'.format(t.id))
	task_name = t.name
	if not task_name:
		task_name = t.url
	email_subject = u'{} changed'.format(task_name)
	user = session.query(CareUser).filter(CareUser.id==t.user_id).first()
	notify_change(user.email, email_subject, t.url, diff_img_path, diff_img_name)

def stabilize_screenshot(t, tmp_screenshot_path1, tmp_screenshot_path2):
	''' 
		Keep getting new screenshots until the screenshots stay the same
		for 2 times, first screenshot comes in as tmp_screenshot_path1,
		take new one as tmp_screenshot_path2, then swap the name as we continue

	'''
	logger.info('[Task {}] Stabilizing screenshot'.format(t.id))

	verification_attempt_count = 0
	verified_no_change_count = 1

	while verification_attempt_count < 1:

		verification_attempt_count = verification_attempt_count + 1
		logger.info('[Task {}] Stabilization attempt: {}'.format(t.id, verification_attempt_count))

		new_screenshot_taken = take_screenshot(t.url, tmp_screenshot_path2, t.wait)
		if new_screenshot_taken:
			changed = compare_img(t, '../screenshot/'+tmp_screenshot_path1, '../screenshot/'+tmp_screenshot_path2)
			if changed:
				logger.info('[Task {}] Changed again during stabilization'.format(t.id))
				verified_no_change_count = 1
			else:
				verified_no_change_count = verified_no_change_count + 1
				logger.info('[Task {}] Page not changed during stabilization, count: {}'.format(t.id, verified_no_change_count))
				if verified_no_change_count == 2:
					logger.info('[Task {}] Page has not changed for 2 times during stabilization.'.format(t.id))
					return True
			tmp_screenshot_path1, tmp_screenshot_path2 = tmp_screenshot_path2, tmp_screenshot_path1
		else:
			logger.info('[Task {}] Fail to get screenshot.'.format(t.id))

	# TODO: what to do if tried 10 times but still can't get a stable screenshot?
	# that would be a bad state and next check will probably be considered a change
	logger.info('[Task {}] Fail to stabilize screenshot'.format(t.id))

	return False

def run_task(t, check_log):
	# run a task, if detected change, run 3 times to verify change
	logger.info('[Task {}] last_run_time {}'.format(t.id, t.last_run_time))
	run_id = t.last_run_id + 1
	
	check_log.run_id = run_id
	old_screenshot_name = '{}-{}.png'.format(t.id, t.last_run_id)
	old_screenshot_path = '../screenshot/{}'.format(old_screenshot_name)
	new_screenshot_name = '{}-{}.png'.format(t.id, run_id)
	tmp_screenshot_name1 = '{}-tmp1.png'.format(new_screenshot_name)
	tmp_screenshot_name2 = '{}-tmp2.png'.format(new_screenshot_name)
	diff_img_name = '{}-{}.png'.format(t.id, run_id)
	diff_img_path = '../screenshot/change/{}'.format(diff_img_name)


	new_screenshot_taken = take_screenshot(t.url, tmp_screenshot_name1, t.wait)
	# if a new screenshot is taken, we take it as a success
	check_log.success = new_screenshot_taken
	# TODO: do we need to retry if fail to take new screenshot?

	previous_screenshot_exist = True
	if not os.path.isfile(old_screenshot_path):
		# TODO: load from s3 if prev screenshot not on same server
		previous_screenshot_exist = False
		logger.info('[Task {}] No previous screenshot.'.format(t.id))
	if not new_screenshot_taken:
		logger.info('[Task {}] Fail to take new screenshot.'.format(t.id))

	# ensure there are screenshots to compare
	if new_screenshot_taken:
		# compare new screenshot with old screenshot
		if previous_screenshot_exist:
			changed = compare_img(t, old_screenshot_path, '../screenshot/'+tmp_screenshot_name1)

			if changed:
				if stabilize_screenshot(t, tmp_screenshot_name1, tmp_screenshot_name2):
					if compare_img(t, old_screenshot_path, '../screenshot/'+tmp_screenshot_name1, diff_img_path):
						logger.info('[Task {}] Verifed change'.format(t.id))
						send_email_to_user(t, diff_img_path, diff_img_name)
						change_image = open(diff_img_path)
						upload_to_s3(change_image, 'screenshot/change/' + diff_img_name)
						check_log.notified = True
						check_log.changed = True
					else:
						check_log.changed = False
				else:
					check_log.success = False
			else:
				check_log.changed = False

		os.rename('../screenshot/'+tmp_screenshot_name1, '../screenshot/'+new_screenshot_name)
		f = open('../screenshot/' + new_screenshot_name)
		res = upload_to_s3(f, 'screenshot/' + new_screenshot_name)


def handle_task(t):
	now = datetime.utcnow()
	time_past = (now-t.last_run_time).total_seconds()
	if time_past >= t.interval:
		logger.info('[Task {}] start running'.format(t.id))
		t.running = True
		t.last_run_by = instance_id
		session.commit()
		check_log = TaskLog(task_id=t.id, timestamp=now, success=False)
		try:
			run_task(t, check_log)
		except Exception as e:
			logger.exception(e)
			logger.error('[Task {}] fail to run task'.format(t.id))
		run_time = (datetime.utcnow() - now).total_seconds()
		logger.info('[Task {}] took {} seconds to finish'.format(t.id, run_time))
		check_log.run_time = run_time
		session.add(check_log)
		t.last_run_time = now
		t.last_run_id = t.last_run_id + 1
		t.last_run_took = run_time
		t.running = False
		session.commit()
		return True
	else:
		logger.info('[Task {}] no need to run yet'.format(t.id))
	return False


def scan_tasks():
	# Only one task will be ran when this function is called
	# to avoid data read from db being stale

	# Get all tasks that need to be ran
	# Sort them with priorities
	# 1st priority: ones that were ran by current instance
	# 2nd priority: ones that weren't ran by any instance
	# 3rd priority: ones that were ran by other instances
	logger.info("Start scanning tasks")
	all_tasks = session.query(CareTask).filter(CareTask.running.isnot(True), \
				CareTask.pause.isnot(True)).order_by(CareTask.last_run_time).all()
	# note that != True won't include cases where value is Null, use isnot
	previous_ran_tasks = []
	never_ran_tasks = []
	other_ran_tasks = []

	for t in all_tasks:
		if t.last_run_by == instance_id:
			previous_ran_tasks.append(t)
		elif t.last_run_by == None:
			never_ran_tasks.append(t)
		else:
			other_ran_tasks.append(t)

	for t in previous_ran_tasks:
		if handle_task(t):
			return
	for t in never_ran_tasks:
		if handle_task(t):
			return
	for t in other_ran_tasks:
		if handle_task(t):
			return


# Get instance id
instance_id = 'not found'
try:
	resp = requests.get('http://169.254.169.254/latest/meta-data/instance-id', timeout=2)
	instance_id = resp.text
except Exception as e:
	pass
logger.info('Instance id: ' + instance_id)
while True:
	scan_tasks()
session.remove()
