import os
import sys
import datetime

from sqlalchemy import Column, ForeignKey, Integer, String, TIMESTAMP, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy import create_engine
 
Base = declarative_base()

class CareTask(Base):
	__tablename__ = 'task'
	# Here we define columns for the table person
	# Notice that each column is also a normal Python instance attribute.
	id = Column(Integer, primary_key=True)
	name = Column(String(255))
	interval = Column(Integer)
	last_run_time = Column(TIMESTAMP, default=datetime.datetime.utcnow)
	created = Column(TIMESTAMP, default=datetime.datetime.utcnow)
	url = Column(String(1000))
	last_run_id = Column(Integer, default=0)
	roi = Column(String(63))
	wait = Column(Integer)
	pause = Column(Boolean)

	def as_dict(self):
		return {
			'id': self.id,
			'name': self.name,
			'interval': self.interval,
			'last_run_id': self.last_run_id,
			'last_run_time': self.last_run_time,
			'created': self.created,
			'url': self.url,
			'roi': self.roi,
			'wait': self.wait,
			'pause': self.pause
		}

class TaskLog(Base):
	__tablename__ = 'log'
	# Here we define columns for the table person
	# Notice that each column is also a normal Python instance attribute.
	id = Column(Integer, primary_key=True)
	task_id = Column(Integer)
	run_id = Column(Integer)
	timestamp = Column(TIMESTAMP)
	changed = Column(Boolean)
	success = Column(Boolean)

	def as_dict(self):
		return {
			'id': self.id,
			'task_id': self.task_id,
			'run_id': self.run_id,
			'timestamp': self.timestamp,
			'changed': self.changed,
			'success': self.success
		}



