from werkzeug.exceptions import HTTPException
from functools import wraps
import logging

from flask import session, abort


logger = logging.getLogger(__name__)

def check_login_session(foo):
	"""
	Check if the request user has valid session.
	"""
	@wraps(foo)
	def wrapper(*args, **kwargs):
		if 'user' in session:
			user = session['user']
			logger.info("{} is hitting API {}".format(user, foo.__name__))
			return foo(*args, **kwargs)
		else:
			abort(401, "Not logged in!")

	return wrapper


def api_exception_handler(foo):

	@wraps(foo)
	def wrapper(*args, **kwargs):

		try:
			return foo(*args, **kwargs)
		except HTTPException as e:
			raise e
		except Exception as e:
			logger.exception('Exception when processing '.format(foo.__name__))
			raise e

	return wrapper