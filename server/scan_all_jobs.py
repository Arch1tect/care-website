# -*- coding: utf-8 -*-
import os
import logging
from datetime import datetime

from db.model import CareTask, TaskLog
from db_session import session
from browser import take_screenshot
from image_diff import compare_img
from mailgun import notify_change
import setup

logger = logging.getLogger(__name__)

def send_email_to_user(t, diff_img_path, diff_img_name):
	logger.info('[Task {}] Notify change'.format(t.id))
	task_name = t.name
	if not task_name:
		task_name = t.url
	email_subject = u'{} changed'.format(task_name)
	notify_change(email_subject, t.url, diff_img_path, diff_img_name)

def stabilize_screenshot(t, tmp_screenshot_path1, tmp_screenshot_path2):
	''' 
		Keep getting new screenshots until the screenshots stay the same
		for 3 times, first screenshot comes in as tmp_screenshot_path1,
		take new one as tmp_screenshot_path2, then swap the name as we continue

	'''
	logger.info('[Task {}] Stabilizing screenshot'.format(t.id))

	verification_attempt_count = 0
	verified_no_change_count = 1

	while verification_attempt_count < 10:

		verification_attempt_count = verification_attempt_count + 1
		logger.info('[Task {}] Stabilization attempt: {}'.format(t.id, verification_attempt_count))

		new_screenshot_taken = take_screenshot(t.url, tmp_screenshot_path2, t.wait)
		if new_screenshot_taken:
			changed = compare_img(t, tmp_screenshot_path1, tmp_screenshot_path2)
			if changed:
				logger.info('[Task {}] Changed again during stabilization'.format(t.id))
				verified_no_change_count = 1
			else:
				verified_no_change_count = verified_no_change_count + 1
				logger.info('[Task {}] Page not changed during stabilization, count: {}'.format(t.id, verified_no_change_count))
				if verified_no_change_count == 3:
					logger.info('[Task {}] Page has not changed for 3 times during stabilization.'.format(t.id))
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
	old_screenshot_path = '../screenshot/{}-{}.png'.format(t.id, t.last_run_id)
	new_screenshot_path = '../screenshot/{}-{}.png'.format(t.id, run_id)
	tmp_screenshot_path1 = '../screenshot/{}-{}-tmp1.png'.format(t.id, run_id)
	tmp_screenshot_path2 = '../screenshot/{}-{}-tmp2.png'.format(t.id, run_id)
	diff_img_name = '{}-{}.png'.format(t.id, run_id)
	diff_img_path = '../screenshot/change/{}'.format(diff_img_name)


	new_screenshot_taken = take_screenshot(t.url, tmp_screenshot_path1, t.wait)
	# if a new screenshot is taken, we take it as a success
	check_log.success = new_screenshot_taken
	# TODO: do we need to retry if fail to take new screenshot?

	previous_screenshot_exist = True
	if not os.path.isfile(old_screenshot_path):
		previous_screenshot_exist = False
		logger.info('[Task {}] No previous screenshot.'.format(t.id))
	if not new_screenshot_taken:
		logger.info('[Task {}] Fail to take new screenshot.'.format(t.id))

	# ensure there are screenshots to compare
	if new_screenshot_taken:
		# compare new screenshot with old screenshot
		if previous_screenshot_exist:
			changed = compare_img(t, old_screenshot_path, tmp_screenshot_path1)

			if changed:

				if stabilize_screenshot(t, tmp_screenshot_path1, tmp_screenshot_path2):
					if compare_img(t, old_screenshot_path, tmp_screenshot_path1, diff_img_path):

						logger.info('[Task {}] Verifed change'.format(t.id))
						send_email_to_user(t, diff_img_path, diff_img_name)
						check_log.notified = True
						check_log.changed = True
					else:
						check_log.changed = False
				else:
					check_log.success = False
			else:
				check_log.changed = False

		os.rename(tmp_screenshot_path1, new_screenshot_path)


for t in session.query(CareTask).all():
	now = datetime.utcnow()
	if t.pause:
		continue
	time_past = (now-t.last_run_time).total_seconds()

	if time_past >= t.interval:
		check_log = TaskLog(task_id=t.id, timestamp=now, success=False)
		try:
			# TODO: store how long it takes to finish running this task
			run_task(t, check_log)
		except Exception as e:
			logger.exception(e)
			logger.error('[Task {}] fail to run task'.format(t.id))
		session.add(check_log)
		t.last_run_time = now
		t.last_run_id = t.last_run_id + 1

session.commit()
session.remove()
