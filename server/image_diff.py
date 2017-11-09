# http://www.pyimagesearch.com/2017/06/19/image-difference-with-opencv-and-python/
import logging

from skimage.measure import compare_ssim
import imutils
import cv2

logger = logging.getLogger(__name__)
SSIM_DIFF_THRESHOLD = 0.0001
def compare_img(task, old_img_path, new_img_path, diff_img_path):
	# load the two input images
	imageA = cv2.imread(old_img_path)
	imageB = cv2.imread(new_img_path)

	if task.roi:
		# crop to region of interest
		logger.info("[Task {}] Getting ROI".format(task.id))
		roi = map(int, task.roi.split()) # x1 y1 x2 y2
		imageA = imageA[roi[1]:roi[3], roi[0]:roi[2]] # [y1:y2, x1:x2]
		imageB = imageB[roi[1]:roi[3], roi[0]:roi[2]] # [y1:y2, x1:x2]

	# convert the images to grayscale
	grayA = cv2.cvtColor(imageA, cv2.COLOR_BGR2GRAY)
	grayB = cv2.cvtColor(imageB, cv2.COLOR_BGR2GRAY)

	logger.info("[Task {}] Comparing SSIM".format(task.id))

	# compute the Structural Similarity Index (SSIM) between the two
	# images, ensuring that the difference image is returned
	(score, diff) = compare_ssim(grayA, grayB, full=True)
	diff = (diff * 255).astype("uint8")
	logger.info("[Task {}] SSIM: {}".format(task.id, score))
	
	if 1-abs(score) < SSIM_DIFF_THRESHOLD:
		logger.info('[Task {}] Hasn\'t changed'.format(task.id))
		return False
		
	logger.info('[Task {}] Detected change'.format(task.id))

	# threshold the difference image, followed by finding contours to
	# obtain the regions of the two input images that differ
	thresh = cv2.threshold(diff, 0, 255,
		cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)[1]
	cnts = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL,
		cv2.CHAIN_APPROX_SIMPLE)
	cnts = cnts[0] if imutils.is_cv2() else cnts[1]

	# Create an overlay for drawing all the solid red boxes
	# Finally we'll blend it with original image
	overlay = imageB.copy()

	# loop over the contours
	for c in cnts:
		# compute the bounding box of the contour and then draw the
		# bounding box on both input images to represent where the two
		# images differ
		(x, y, w, h) = cv2.boundingRect(c)
		cv2.rectangle(overlay, (x, y), (x + w, y + h), (0, 255, 255), -1)

	cv2.addWeighted(overlay, 0.5, imageB, 0.5, 0, imageB)


	# show the output images
	# cv2.imwrite('Ori.png', imageA)
	cv2.imwrite(diff_img_path, imageB)
	# cv2.imwrite('Diff.png', diff)
	# cv2.imwrite('Thresh.png', thresh)

	return True

# old_img_path = 'original_02.png'
# new_img_path = 'modified_02.png'
# compare_img(old_img_path, new_img_path)