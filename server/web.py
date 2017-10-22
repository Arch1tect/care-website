import time
import logging

from flask import Flask, jsonify, request

import setup
from db_session import session
from db.model import CareTask

app = Flask(__name__)

logger = logging.getLogger(__name__)

@app.route("/api/tasks/user/<user_id>")
def get_all_tasks_for_user(user_id):
	'''return all tasks for a user'''
	# TODO: add user id filter when we support multiple users

	tasks = session.query(CareTask).all()

	return jsonify([t.as_dict() for t in tasks])



# TODO debug=True only for dev environment
app.run(debug=True, host='0.0.0.0', port=9000)
