from image_diff import compare_img
from db.model import CareTask





task = CareTask()

print 'hi'


old_img_path = '../screenshot/74-3.png'
new_img_path = '../screenshot/74-4.png'
diff_img_path = '../screenshot/9998.png'

compare_img(task, old_img_path, new_img_path, diff_img_path)
