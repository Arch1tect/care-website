from flask import session, abort
from functools import wraps

def check_login_session(foo):
	"""
	Check if the request user has valid session.
	"""
	@wraps(foo)
	def wrapper(*args, **kwargs):
		if 'user' in session:
			print session['user']
			return foo(*args, **kwargs)
		else:
			abort(401, "Not logged in!")

	return wrapper