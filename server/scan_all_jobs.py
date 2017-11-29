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


def verify_change(t, screenshot_before_change):
	# verify the change is real

def run_task(t, check_log):
	# run a task, if detected change, run 3 times to verify change
	logger.info('[Task {}] last_run_time {}'.format(t.id, t.last_run_time))
	run_id = t.last_run_id + 1
	check_log.run_id = run_id
	old_screenshot_path = '../screenshot/{}-{}.png'.format(t.id, t.last_run_id)
	new_screenshot_name = '{}-{}.png'.format(t.id, run_id)
	new_screenshot_path = '../screenshot/{}'.format(new_screenshot_name)

	new_screenshot_taken = take_screenshot(t.url, new_screenshot_path, t.wait)
	# if a new screenshot is taken, we take it as a success
	check_log.success = new_screenshot_taken
	# TODO: do we need to retry if fail to take new screenshot?

	if not os.path.isfile(old_screenshot_path):
		logger.info('[Task {}] No previous screenshot.'.format(t.id))
	if not new_screenshot_taken:
		logger.info('[Task {}] Fail to take new screenshot.'.format(t.id))

	# ensure there's a previous screenshot to compare
	if new_screenshot_taken and os.path.isfile(old_screenshot_path):
		# compare new screenshot with old screenshot
		diff_img_name = '{}-{}.png'.format(t.id, run_id)
		diff_img_path = '../screenshot/change/{}'.format(diff_img_name)

		changed = compare_img(t, old_screenshot_path, new_screenshot_path, diff_img_path)


		if changed and verify_change:
			logger.info('[Task {}] Notify change'.format(t.id))
			task_name = t.name
			if not task_name:
				task_name = t.url
			email_subject = '{} changed'.format(task_name)
			diff_img_name = '{}-{}.png'.format(t.id, t.last_run_id-1)
			diff_img_path = '../screenshot/change/{}'.format(diff_img_name)
			notify_change(email_subject, t.url, diff_img_path, diff_img_name)
			check_log.notified = True
			check_log.change = True

		else:
			check_log.change = False





for t in session.query(CareTask).all():
	now = datetime.utcnow()

	if t.pause:
		continue
	time_past = (now-t.last_run_time).total_seconds()

	if time_past >= t.interval:
		check_log = TaskLog(task_id=t.id, timestamp=now, success=False)
		try:
			run_task(t, check_log)
		except Exception as e:
			logger.exception(e)
			logger.error('[Task {}] fail to check time past'.format(t.id))
		session.add(check_log)
		t.last_run_time = now
		t.last_run_id = t.last_run_id + 1

session.commit()
session.remove()
