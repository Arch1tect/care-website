import logging

import boto3

logger = logging.getLogger(__name__)


s3_client = boto3.client(
	's3',
	aws_access_key_id='AKIAIF2B5KP4GNYWBOJQ',
	aws_secret_access_key='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'
)

bucket = 'watchman-asia'


def upload_to_s3(file, file_name):
	'''https://watchman-asia.s3.amazonaws.com/screenshot/'''
	resp = s3_client.put_object(Body=file, Bucket=bucket, Key=file_name, ContentType='image/png', ACL='public-read')

	if resp['ResponseMetadata']['HTTPStatusCode'] != 200:
		logger.error('Failed to upload {}'.format(file_name))
	return resp


def delete_file(file_name):
	return s3_client.delete_object(Bucket=bucket, Key=file_name)



def list_files():
	return s3_client.list_objects(Bucket=bucket)


def get_file_meta(file_name):
	return s3_client.head_object(Bucket=bucket, Key=file_name)


def copy_file(src_key_name, dst_key_name):
	res = s3_client.copy_object(Bucket=bucket, CopySource="{}/{}".format(bucket, src_key_name), Key=dst_key_name, ContentType='image/png', ACL='public-read')
	print res
	return res

# f = open('/Users/wotong.shen/myProject/haha.png')
# res = upload_to_s3(f, 'screenshot/'+'tttest.png')

# print res
# print res['ResponseMetadata']