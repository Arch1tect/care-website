# Care
Monitor web page change that you care

# Mysql
sudo yum install mysql-devel gcc gcc-devel python-devel


# Docker
It's not very easy to set up environment correctly for headless chrome, so we use docker to set up chrome for taking screenshots, build docker image with included Dockerfile:

`docker build -t <image name> .`

## Share directory

`docker run -td -v <absolute path of directory to be shared>:/<path to shared directory in container> <image name>`

e.g. `docker run -td --shm-size=512m -v /public/care-website/:/mnt/care-website care`

Change your cron job to

`* * * * * docker exec <container_id> python /host_share/src/app.py`

Test cronjob with
`docker exec 990c68ddf61d python /host_share/src/app.py`

This way it will use project directory outside of docker container



# Installing chrome on ec2
If not using docker...
sudo yum --nogpgcheck localinstall https://intoli.com/blog/installing-google-chrome-on-centos/google-chrome-stable-60.0.3112.113-1.x86_64.rpm


# Docker error : no space left on device

Try command below
`docker rm $(docker ps -a -q)`


