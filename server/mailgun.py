import requests
import logging

from crypto import hash_email

logger = logging.getLogger(__name__)

def send_simple_message(subject, to, msg=None, html=None, files=None):
	res =  requests.post(
		"https://api.mailgun.net/v3/webwatchman.com/messages",
		auth=("api", "key-c5e95173a1f60ab411eff18031723799"),
		files=files,
		data={"from": "Web Watchman <watchman@donotreply.com>",
			  "to": ["Dear", to],
			  "subject": subject,
			  "html": html,
			  "text": msg})
	logger.info("Sent email to {}, res {}".format(to, res.text))
	return res

def send_welcome_email(email, tmp_password):
	subject = "Welcome! Please confirm your email address"
	confirm_email_link = "webwatchman.com/api/confirm_email?email={}&secret={}".format(email, hash_email(email))
	html = "<br/>Welcome! Your account has been created with Web Watchman! "
	html += "<br/><br/>Please click <a href='{}'>here</a> to confirm your email.".format(confirm_email_link)
	html += "<br/>"
	html += "<br/>Your temporary password is: <b>" + tmp_password +"</b>"
	html += "<br/><br/>If you did not register with Web Watchman, please ignore this email."
	html += "<br/>"
	html += "<br/>"
	html += "<br/>Thank you!"
	html += "<br/><a href='webwatchman.com'>Web Watchman</a>"
	html += "<br/>"
	res = send_simple_message(subject, email, html=html)
	return res

def notify_change(email, subject, url, img_path, img_name):
# http://mailgun-documentation.readthedocs.io/en/latest/user_manual.html#sending-via-api
	html = "<html>Content at <a href='{0}'>{1}</a> has changed: <br/><img src='cid:{2}' style='max-width:500px;'><br/><br/><br/>Manage your tasks <a href='webwatchman.com/task.html'>here</a>.<br/>Thank you!<br/><a href='webwatchman.com'>Web Watchman</a></html>".format(url, url, img_name)
	files = [("inline", open(img_path))]

	return send_simple_message(subject, email, html=html, files=files)