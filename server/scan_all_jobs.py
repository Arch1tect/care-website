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


def run_task(t, found_change_last_run=False):
	# run a task, if detected change, run again to verify change
	# to verify change, compare with last run that we found change to
	# see if change stays
	# There maybe better approaches?
	if (found_change_last_run):
		logger.info('[Task {}] found change last time, running again to verify'.format(t.id))
	logger.info('[Task {}] last_run_time {}'.format(t.id, t.last_run_time))
	check_log = TaskLog(task_id=t.id, timestamp=now, success=False)
	changed = False
	try:
		# get new screenshot
		old_screenshot_path = '../screenshot/{}-{}.png'.format(t.id, t.last_run_id)
		new_screenshot_name = '{}-{}.png'.format(t.id, t.last_run_id + 1)
		new_screenshot_path = '../screenshot/{}'.format(new_screenshot_name)
		t.last_run_id = t.last_run_id + 1
		t.last_run_time = now
		check_log.run_id = t.last_run_id
		new_screenshot_taken = take_screenshot(t.url, new_screenshot_path, t.wait)
		# if a new screenshot is taken, we take it as a success
		check_log.success = new_screenshot_taken

		# ensure there's a previous screenshot to compare
		if os.path.isfile(old_screenshot_path):
			# compare new screenshot with old screenshot
			diff_img_name = '{}-{}.png'.format(t.id, t.last_run_id)
			diff_img_path = '../screenshot/change/{}'.format(diff_img_name)

			changed = compare_img(t, old_screenshot_path, new_screenshot_path, diff_img_path)
			check_log.changed = changed

			if found_change_last_run:
				if not changed:
					# already found change last time, verified the change stays
					logger.info('[Task {}] Notify change'.format(t.id))
					task_name = t.name
					if not task_name:
						task_name = t.url
					email_subject = '{} changed'.format(task_name)
					diff_img_name = '{}-{}.png'.format(t.id, t.last_run_id-1)
					diff_img_path = '../screenshot/change/{}'.format(diff_img_name)
					notify_change(email_subject, t.url, diff_img_path, diff_img_name)
					check_log.notified = True
		else:
			logger.info('[Task {}] No previous screenshot.'.format(t.id))
	except Exception as e:
		logger.exception(e)
		logger.error('[Task {}] fail to check update'.format(t.id))

	session.add(check_log)
	if changed and not found_change_last_run:
		run_task(t, True)



for t in session.query(CareTask).all():
	now = datetime.utcnow()
	new_screenshot_taken = False
	try:
		if t.pause:
			continue
		time_past = (now-t.last_run_time).total_seconds()

		if time_past >= t.interval:
			run_task(t)

	except Exception as e:
		logger.exception(e)
		logger.error('[Task {}] fail to check time past'.format(t.id))

session.commit()
session.remove()

