import hashlib


email_hash_salt = 'if this is changed, email confirmation links will be broken!'

def hash_email(email):
	email = email + email_hash_salt
	res = hashlib.sha512(email)
	return res.hexdigest()