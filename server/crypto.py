import hashlib
import string
import random

email_hash_salt = 'if this is changed, email confirmation links will be broken!'

def hash_email(email):
	email = email + email_hash_salt
	res = hashlib.sha512(email)
	return res.hexdigest()


def generate_password(length=10):
	chars = string.letters + string.digits
	return ''.join((random.choice(chars)) for x in range(length))