scan_all_jobs_pid=$(</var/run/scan_all_jobs.pid)

if ps -p $scan_all_jobs_pid > /dev/null
then
	echo $scan_all_jobs_pid is still running
else
	python /public/care-website/server/scan_all_jobs.py & echo $! > /var/run/scan_all_jobs.pid
fi
