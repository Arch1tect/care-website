 # -*- coding: utf-8 -*-
from mailgun import send_simple_message
from db.model import CareTask
from db_session import session


# def send_simple_message(subject, to, msg=None, html=None, files=None):


task = session.query(CareTask).filter(CareTask.id==115).first()
name = task.name
print name
print type(name)
# print name.decode('utf-8')
print name

print type(name)

content = '你好'
print content
print type(content)

res = send_simple_message(name, 'swtdavid@gmail.com', content)

print res
print res.text