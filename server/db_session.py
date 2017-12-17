from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session

import setup
from cfg.credentials import db_user, db_password

db_url = 'chat-anywhere-mysql.cjwz9xnh80ai.us-west-1.rds.amazonaws.com'
connection_str = 'mysql://{}:{}@{}/care?charset=utf8'.format(db_user, db_password, db_url)
engine = create_engine(connection_str)
session = scoped_session(sessionmaker(bind=engine))
