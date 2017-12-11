import requests
from crypto import hash_email

def send_simple_message(subject, to, msg=None, html=None, files=None):
	return requests.post(
		"https://api.mailgun.net/v3/sandboxd1b6c36cfcee4a788c1d9794208e7583.mailgun.org/messages",
		auth=("api", "key-c5e95173a1f60ab411eff18031723799"),
		files=files,
		data={"from": "Watchmen <watchmen@donotreply.com>",
			  "to": ["Dear", to],
			  "subject": subject,
			  "html": html,
			  "text": msg})

def send_welcome_email(email, tmp_password):
	subject = "Welcome! Please confirm your email address"
	html = "<br/>Welcome! Your account has been created at Watchmen! "
	html += "<br/>Please click the following link to confirm your email."
	html += "<br/>" + hash_email(email)
	html += "<br/>Your temporary password is: <b>" + tmp_password +"</b>"
	html += "<br/>If you did not register at Watchmen, please ignore this email."
	html += "<br/>"
	html += "<br/>"
	html += "<br/>Thank you!"
	html += "<br/>"
	html += "<br/>"
	res = send_simple_message(subject, email, html=html)
	return res

def notify_change(subject, url, img_path, img_name):
# http://mailgun-documentation.readthedocs.io/en/latest/user_manual.html#sending-via-api
	html = "<html>Content at <a href='{0}'>{1}</a> has changed: <img src='cid:{2}' style='max-width:400px;'></html>".format(url, url, img_name)
	files = [("inline", open(img_path))]

	return send_simple_message(subject, 'swtdavid@gmail.com', html=html, files=files)