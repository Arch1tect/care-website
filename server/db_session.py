from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import setup
from cfg.credentials import db_user, db_password

db_url = 'chat-anywhere-mysql.cjwz9xnh80ai.us-west-1.rds.amazonaws.com'
connection_str = 'mysql://{}:{}@{}'.format(db_user, db_password, db_url)
engine = create_engine(connection_str, encoding='utf8')
engine.execute("USE care")
DBSession = sessionmaker(bind=engine)
session = DBSession()
