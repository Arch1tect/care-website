var pageSize = 10;
var pageNum = 1;
var totalPages = 1;
var taskLogs = [];
var task = null;
var taskId = null;
var roiStr = null;

function addRow(cells) {
		
	var $row = $("<tr></tr>");
	$.each(cells, function(i, cell){
		var $td = $("<td></td");
		$td.append(cell);
		$row.append($td);
	});
	$('.task-table tbody').append($row);


}

function addROI($img) {

	if (! $('#enlargeImageModal').is(':visible')) {
		setTimeout(function() {
			addROI($img);
		}, 100);
	} else {
		showExistingROI($img);
	}
	
}
function showExistingROI($img) {
	// image/modal must have already loaded fully
	var $roiBox = $('.roi-box');

	var screenshotDisplayRatio = $img.width()/$img[0].naturalWidth;

	if (!roiStr){
		$roiBox.hide();
		return;
	}
	var roi = roiStr.split(' ').map(Number);

	$.each(roi, function(index, value) {
		roi[index] = value * screenshotDisplayRatio;
	});
	$roiBox.width(roi[2]-roi[0]);
	$roiBox.height(roi[3]-roi[1]);
	$roiBox.css({top: roi[1], left: roi[0]});
	$roiBox.show();

}

function showImageInModal(taskLog, change) {

	return function() {
		$('.modal-title').text(taskLog.timeFormatted);
		var url = taskLog.changeUrl;
		if (!change) {
			url = taskLog.screenshotUrl;
		}
		var $img = $('img.imageLarge');
		$img.attr('src', url);
		$img.data('taskLog', taskLog);
		if (change) {
			$img.addClass('change');
			$img.removeClass('full');
			$('.roi-box').hide();
		}else {
			$img.addClass('full');
			$img.removeClass('change');
			addROI($img);

		}

		$('#enlargeImageModal').modal('show');
	}

}

function taskLogHasImg(taskLog, change) {
	if (change)
		return taskLog.changeUrl;

	return taskLog.screenshotUrl;
}

function changeImg(goPrev) {

	var $img = $('img.imageLarge');
	var taskLog = $img.data('taskLog');
	var change = $img.hasClass('change');

	if (goPrev) {
		taskLog = taskLog.last;
		while (taskLog && !taskLogHasImg(taskLog, change))
			taskLog = taskLog.last;

	}
	else {
		taskLog = taskLog.next;
		while (taskLog && !taskLogHasImg(taskLog, change))
			taskLog = taskLog.next;
	}

	if (taskLog) {

		if (change) {
			$img.attr('src', taskLog.changeUrl);
		}
		else
			$img.attr('src', taskLog.screenshotUrl);

		$('.modal-title').text(taskLog.timeFormatted);
		$img.data('taskLog', taskLog);
		$img.hide();
		$('.roi-box').hide();
	}
}

function loadHisotry(logs) {
	$(window).scrollTop(0);
	$('.task-table tbody tr').remove();
	var i = (pageNum-1)*pageSize;
	var last = null;
	for (; i < Math.min(logs.length, pageNum*pageSize); i++) {
		var taskLog = logs[i];
		taskLog.last = last;
		if (last)
			last.next = taskLog;
		last = taskLog;
		var cells = []
		// ID
		var $idDiv = $("<div></div>");
		$idDiv.text(taskLog.run_id);
		cells.push($idDiv);

		// Time
		var $timeDiv = $("<div></div>");
		var createdTime = new Date(taskLog.timestamp);
		var formattedTime = moment(createdTime).format('YY/MM/DD HH:mm');
		$timeDiv.text(formattedTime);
		cells.push($timeDiv);
		taskLog.timeFormatted = formattedTime;

		// changed
		var $changeDiv = $("<div class='task-log-change-img'></div>");
		var changedImgUrl = '';

		if (taskLog.changed) {
			var $changedImg = $("<img class='change'></img>");
			var changedImgUrl = s3_screenshot_url+'change/'+taskId+'-'+taskLog.run_id+'.png';
			$changedImg.attr('src', changedImgUrl);
			$changedImg.click(showImageInModal(taskLog, true));
			$changeDiv.append($changedImg);
			taskLog.changeUrl = changedImgUrl;

		}else {
			// taskLog.changed can be null
			var changed = taskLog.changed === false ? "No" : "N/A";
			$changeDiv.text(changed);
		}

		cells.push($changeDiv);
		if (taskLog.notified) {
			var $notifiedSpan = $("<span title='notification sent'></span>");
			$notifiedSpan.addClass('notified fa fa-paper-plane-o');
			$changeDiv.append($notifiedSpan);
		}

		// screenshot btn
		var $btn = $("<button class='btn btn-primary'></button");
		$btn.text('View');
		var fullScreeshotUrl = s3_screenshot_url+taskId+'-'+taskLog.run_id+'.png';
		taskLog.screenshotUrl = fullScreeshotUrl;
		$btn.click(showImageInModal(taskLog, false));
		cells.push($btn);

		addRow(cells);

	}
}


function setupPages(logs) {
	$('.history-pagination').empty();
	$('.history-pagination').removeData("twbs-pagination");
	$('.history-pagination').unbind("page");
	if (logs.length > 0) {
		totalPages = Math.max(1, Math.ceil(logs.length/pageSize));
		$('.history-pagination').twbsPagination({
			totalPages: totalPages,
			visiblePages: 7,
			onPageClick: function (event, page) {
				console.log('go to page ' + page);
				pageNum = page;
				loadHisotry(logs);
			}
		});

	} else {

		// TODO: shouldn't happen since there is a log
		// entry when task first created
		// Possible if filter only changed logs
		loadHisotry(logs);

	}


}
jQuery(document).ready(function(){

	$('.carousel-control').click(function() {
		changeImg($(this).hasClass('left'));
	});

	taskId = window.location.search.substring(4)
	$(".change-only-check").on("change", function()
    {
        var checked = $(this).prop("checked");
        console.log(checked);
        if (checked) {
        	var logs = taskLogs.filter(function(tl){
				return tl.changed;
			});
        	setupPages(logs);
        }
        else {
        	setupPages(taskLogs);
        }
    });
	$(".modal").keydown(function(e) {
		if(e.keyCode == 37) { // left
			changeImg(true);
		}
		else if(e.keyCode == 39) { // right
			changeImg(false);
		}
	});

	$('.screenshot').on("load", function(){
		$('img.imageLarge').fadeIn('fast', function(){
			if (!$(this).hasClass('change'))
				showExistingROI($(this));
		});
	});

	var noty = createNoty('Loading task history...');
	$.ajax ({
		url: "api/task/"+taskId,
		type: "GET",
		contentType: "application/json",
	}).done(
		function(data) {
			console.log(data);
			closeNoty(noty,'success', 'Loaded!');
			task = data.task;
			roiStr = task.roi;
			taskLogs = data.log.reverse();
			setupPages(taskLogs);
		}
	).fail(
		function(error) {
			closeNoty(noty, 'error', error.statusText);
		}
	);

});
