import requests

def send_simple_message(subject, msg=None, html=None, files=None):
	return requests.post(
		"https://api.mailgun.net/v3/sandboxd1b6c36cfcee4a788c1d9794208e7583.mailgun.org/messages",
		auth=("api", "key-c5e95173a1f60ab411eff18031723799"),
		files=files,
		data={"from": "Page Monitor <care@arch.tech>",
			  "to": ["yo", "swtdavid@gmail.com"],
			  "subject": subject,
			  "html": html,
			  "text": msg})

def notify_change(subject, url, img_path, img_name):
# http://mailgun-documentation.readthedocs.io/en/latest/user_manual.html#sending-via-api
	html = "<html>Content at <a href='{0}'>{1}</a> has changed: <img src='cid:{2}' style='max-width:400px;'></html>".format(url, url, img_name)
	files = [("inline", open(img_path))]

	return send_simple_message(subject, html=html, files=files)