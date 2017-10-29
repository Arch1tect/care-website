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


for t in session.query(CareTask).all():
	now = datetime.utcnow()
	new_screenshot_taken = False
	try:
		time_past = (now-t.last_run_time).total_seconds()

		if time_past >= t.interval:
			check_log = TaskLog(task_id=t.id, timestamp=now, success=False)
			try:
				logger.info('[Task {}] last_run_time {}'.format(t.id, t.last_run_time))

				# get new screenshot
				old_screenshot_path = '../screenshot/{}-{}.png'.format(t.id, t.last_run_id)
				new_screenshot_name = '{}-{}.png'.format(t.id, t.last_run_id + 1)
				new_screenshot_path = '../screenshot/{}'.format(new_screenshot_name)
			
				new_screenshot_taken = take_screenshot(t.url, new_screenshot_path)
				
				if new_screenshot_taken:

					t.last_run_id = t.last_run_id + 1
					t.last_run_time = now
					# ensure there's a previous screenshot to compare
					if os.path.isfile(old_screenshot_path):
						# compare new screenshot with old screenshot
						diff_img_name = '{}-{}.png'.format(t.id, t.last_run_id+1)
						diff_img_path = '../screenshot/change/{}'.format(diff_img_name)

						changed = compare_img(t, old_screenshot_path, new_screenshot_path, diff_img_path)
						check_log.changed = changed
						if changed:
							logger.info('[Task {}] Notify change'.format(t.id))
							task_name = t.name
							if not task_name:
								task_name = t.url
							email_subject = '{} changed'.format(task_name)
							notify_change(email_subject, t.url, diff_img_path, diff_img_name)

					else:
						logger.info('[Task {}] No previous screenshot.'.format(t.id))
					check_log.success = True
			except Exception as e:
				logger.exception(e)
				logger.error('[Task {}] fail to check update'.format(t.id))
			session.add(check_log)

	except Exception as e:
		logger.exception(e)
		logger.error('[Task {}] fail to check time past'.format(t.id))

session.commit()
session.remove()

