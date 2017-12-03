var roiToggle = false;
var screenshotDisplayRatio = 1;
var selectedBox = null;
var tasks = null;

function removeEditableROI() {
	if (window.jcrop_api) {
		console.log('remove jcrop');
		window.jcrop_api.destroy();
		$('.jcrop-holder').remove();
		selectedBox = null;
		screenshotDisplayRatio = 1;
		$(".screenshot").removeAttr('style');
	}
}

function checkRoiBtn() {
	// called on image in modal has changed
	// if image is a changeScreenshot hide update ROI btns
	var $img = $('#enlargeImageModal img');
	var node = $img.data('imgNode');
	if (node.change) {
		$('#update-roi-btn').hide();
		$('.roi-control').hide();
	} else {
		$('.roi-control').show();
		if (roiToggle)
			$('#update-roi-btn').show();

	}
}
function getROI($img) {	
	var roiStr = $img.data('imgNode').task.roi;
	if (roiStr)
		return roi = roiStr.split(' ').map(Number);
	return [];
}

function showExistingROI($img) {
	// image/modal must have already loaded fully
	var $roiBox = $('#roi-box');

	screenshotDisplayRatio = $img.width()/$img[0].naturalWidth;
	var roi = getROI($img);
	if (!roi.length){
		return;
	}

	$.each(roi, function(index, value) {
		roi[index] = value * screenshotDisplayRatio;
	});
	$roiBox.width(roi[2]-roi[0]);
	$roiBox.height(roi[3]-roi[1]);
	$roiBox.css({top: roi[1], left: roi[0]});
	$roiBox.show();

}

function editROI($img) {

	// image/modal must have already loaded fully
	screenshotDisplayRatio = $img.width()/$img[0].naturalWidth;
	var roi = getROI($img);
	if (roi) {
		$.each(roi, function(index, value) {
			roi[index] = value * screenshotDisplayRatio;
		});
	}
	$img.Jcrop({
		onChange:   showCoords,
		onSelect:   showCoords,
		keySupport: false,
		setSelect:  roi
	},function(){
		console.log('start jcrop')
		window.jcrop_api = this;
	});

}
function removeROI() {
	removeEditableROI();
	var $roiBox = $('#roi-box');
	$roiBox.hide();
}
function updateROI($img) {
	// called on modal image change
	if (! $('#enlargeImageModal').is(':visible')) {
		setTimeout(function() {
			updateROI($img);
		}, 100);
	} else {
		var node = $img.data('imgNode');
		checkRoiBtn();
		removeROI();
		if (!node.change) {
			showExistingROI($img);
			if (roiToggle) {
				editROI($img);
			}
		}

	}
	
}

// Simple event handler, called from onChange and onSelect
// event handlers, as per the Jcrop invocation above
function showCoords(c)
{
	var x1 = parseInt(c.x/screenshotDisplayRatio);
	var y1 = parseInt(c.y/screenshotDisplayRatio);
	var x2 = parseInt(c.x2/screenshotDisplayRatio);
	var y2 = parseInt(c.y2/screenshotDisplayRatio);
	console.log('('+x1+' '+y1+'), ' + '('+x2+' '+y2+')');
	console.log('width: '+c.w+' height: '+c.h);
	if(c.w>10&&c.h>10) {
		selectedBox = x1 + ' ' + y1 + ' ' + x2 + ' ' + y2;
	}else {
		selectedBox = null;
	}
}

function testScreenshot(taskId) {

	return function() {
		var loadingImg = 'assets/img/loading-spinner.gif';

		$('#testScreenshotModal').modal('show');
		$('#testScreenshotModal img').attr('src', loadingImg);

		$.ajax ({
			url: "api/task/"+taskId+'/screenshot',
			type: "GET",
			contentType: "application/json",
		}).done(function(screenshotName) {

			$('#testScreenshotModal img').attr('src', "screenshot/" + screenshotName);

		});
	}
}

function pauseOrContinueTask(taskId, $btn) {
	return function() {

		var pause = $btn.data('pause');
		var endpoint = 'pause';
		if (pause)
			endpoint = 'continue';

		$.ajax ({
			url: "api/task/"+taskId+'/'+endpoint,
			type: "GET",
			contentType: "application/json",
		}).done(function() {

			var $row = $btn.closest('tr');
			var $status = $row.find('.task-status');
			if (pause) {
				$btn.data('pause', false);
				$btn.text('Pause');
				$btn.removeClass('btn-success');
				$row.addClass('active-task');
				$status.text('Active');
				$row.removeClass('paused-task');
				$btn.addClass('btn-warning');
			} else {
				$btn.data('pause', true);
				$btn.text('Continue');
				$row.addClass('paused-task');
				$status.text('Paused');
				$row.removeClass('active-task');
				$btn.removeClass('btn-warning');
				$btn.addClass('btn-success');
			}
		});


	}
}

function initialScreenshotSrc(task) {
	return 'screenshot/'+task.id+'-0.png';
}
function lastScreenshotSrc(task) {
	return 'screenshot/'+task.id+'-'+task.last_run_id+'.png';
}
function lastTriggeredChangeSrc(task) {
	var taskLog = task.log_changed;
	var logId = taskLog.run_id;
	return 'screenshot/change/'+task.id+'-'+logId+'.png';
}
function updateEnlargeModal(node) {
	$title = $('#enlargeImageModal .modal-title');
	$title.text(node.time);
	$img = $('#enlargeImageModal img');
	$img.hide();
	removeROI();
	$img.attr('src', node.url);
	$img.data('imgNode', node);
}
function addRow(cells) {
		
	var $row = $("<tr></tr>");
	$.each(cells, function(i, cell){
		var $td = $("<td></td");
		$td.append(cell);
		$row.append($td);
	});
	$('.task-table tbody').append($row);

	return $row;
}

function changeImg(goPrev) {
	var $img = $('#enlargeImageModal img');
	var node = $img.data('imgNode');
	if (goPrev)
		node = node.last;
	else
		node = node.next;

	if (node)
		updateEnlargeModal(node);
}

function constructLinkedListNode($img, task, lastNode, time, url) {
	var node = {};
	node.task = task;
	node.time = time;
	node.url = url;
	if (lastNode)
		lastNode.next = node;
	node.last = lastNode;
	$img.data('imgNode', node);
	return node;
}

jQuery(document).ready(function(){

	$.ajax ({
		url: "api/tasks/user/123",
		// url: "http://54.215.208.165/api/tasks/user/123",
		type: "GET",
		contentType: "application/json",
	}).done(
		function(data) {
			console.log(data);
			tasks = data;
			var lastImgNode = null;
			$.each(data, function(i, task){

				var cells = []
				// task name and status
				var $nameWrapper = $("<div></div");
				var $taskName = $("<span class='task-name'></span");
				var taskName = 'No name';
				if (task.name)
					taskName = task.name;
				$taskName.text(taskName);
				var $status = $("<div class='task-status'>Active</div>");
				var $editNameIcon = $('<i class="fa fa-pencil edit-task-name" aria-hidden="true"></i>');
				$editNameIcon.data('task', task);
				$editNameIcon.data('span', $taskName);
				$nameWrapper.append($status);
				$nameWrapper.append($taskName);
				$nameWrapper.append($editNameIcon);

				cells.push($nameWrapper);

				// initial image
				var $imgWrapper = $("<div class='cell'></div");
				var $initImg = $("<img class='initial-screenshot'></img>");
				$initImg.attr('src', initialScreenshotSrc(task));
				// $initImg.data('task', task);
				$imgWrapper.append($initImg);
				// cells.push($imgWrapper);
				// created time
				var $created = $("<span class='friendly-time'></span>");
				var createdTime = moment(new Date(task.created)).fromNow();
				$created.text(createdTime);
				// lastImgNode = constructLinkedListNode($initImg, task, lastImgNode, createdTime, initialScreenshotSrc(task));


				// latest screenshot
				var $imgWrapper2 = $("<div class='cell'></div");
				var $lastImg = $("<img></img>");
				// $lastImg.data('task', task);
				$lastImg.attr('src', lastScreenshotSrc(task));
				$imgWrapper2.append($lastImg);
				cells.push($imgWrapper2);
				// latest check time
				var $lastCheck = $("<span class='friendly-time'></span>");
				var lastCheckTime = moment(new Date(task.last_run_time)).fromNow();
				$lastCheck.text(lastCheckTime);
				lastImgNode = constructLinkedListNode($lastImg, task, lastImgNode, lastCheckTime, lastScreenshotSrc(task));

				// latest change
				var $imgWrapper3 = $("<div></div>");

				if (task['log_changed']) {
					$imgWrapper3.addClass('cell');
					var $triggerImg = $("<img class='change'></img>");
					$triggerImg.attr('src', lastTriggeredChangeSrc(task));
					var $verticalMiddleHelper = "<span style='height: 100%;vertical-align: middle;display: inline-block;'></span>";
					$imgWrapper3.append($verticalMiddleHelper);
					$imgWrapper3.append($triggerImg);
					var $triggeredTimeWrapper = $("<span class='friendly-time'></span>");
					var triggeredTime = moment(new Date(task['log_changed'].timestamp)).fromNow();
					$triggeredTimeWrapper.text(triggeredTime);
					task.triggeredTimeFormatted = $triggeredTimeWrapper.text();
					lastImgNode = constructLinkedListNode($triggerImg, task, lastImgNode, triggeredTime, lastTriggeredChangeSrc(task));
					lastImgNode.change = true;
				} else {
					$imgWrapper3.text('N/A');
					// $imgWrapper3.addClass('table-cell');
				}

				cells.push($imgWrapper3);

				// settings
				var $settings = $("<div class='task-setting'></div>");
				var $urlWrapper = $("<div></div>");
				var $urlIcon = $("<i class='fa fa-link fa-fw'></i>");
				var $url = $("<a></a>");
				var url = ' ' + task.url;
				if (url.length > 25) {
					url = url.substring(0, 20) + '...';
				}
				$url.text(url);
				$url.attr('href', task.url);
				$url.attr('target', '_blank');
				$urlWrapper.append($urlIcon);
				$urlWrapper.append($url);
				$settings.append($urlWrapper);


				var $intervalWrapper = $("<div class='interval-wrapper'></div>");
				var $interval = $("\
					<span class='dropdown-toggle' data-toggle='dropdown'>\
					<span class='interval'>5 min</span>\
					<span class='caret'></span></span>\
					<ul class='dropdown-menu interval'>\
						<li data-interval='60'>1 min</li>\
						<li data-interval='300'>5 min</li>\
						<li data-interval='600'>10 min</li>\
						<li data-interval='1800'>30 min</li>\
						<li data-interval='3600'>1 hour</li>\
						<li data-interval='10800'>3 hour</li>\
						<li data-interval='21600'>6 hour</li>\
						<li data-interval='43200'>12 hour</li>\
						<li data-interval='86400'>1 day</li>\
					</ul>");
				var $clockIcon = $("<i class='fa fa-clock-o fa-fw'></i>");
				$intervalWrapper.append($clockIcon);
				$intervalWrapper.append($interval);

				$interval.find('.interval').text(moment.duration(task.interval*1000).humanize());
				$settings.append($intervalWrapper);

				var $historyWrapper = $("<div></div>");
				var $historyIcon = $("<i class='fa fa-calendar fa-fw'></i>");
				var $history = $("<a></a>");
				// var $history = $("<button class='btn btn-success'></button>");
				$history.text(' Check history >>');
				$history.attr('href', 'task-history.html?id='+task.id)
				$historyWrapper.append($historyIcon);
				$historyWrapper.append($history);
				$settings.append($historyWrapper);


				var $buttonsWrapper = $("<div class='btn-group'></div>");
				var $runBtn = $("<button class='btn btn-info'>Test</button>");
				$runBtn.click(testScreenshot(task.id));
				var $pauseBtn = $("<button class='btn'>Pause</button>");
				if (task.pause) {
					$pauseBtn.text('Continue');
					$pauseBtn.addClass('btn-success');
				}else {
					$pauseBtn.addClass('btn-warning');
				}
				$pauseBtn.data('pause', task.pause);
				$pauseBtn.click(pauseOrContinueTask(task.id, $pauseBtn));

				var $remove = $("<button class='btn btn-danger delete-task'>Delete</button>");
				$buttonsWrapper.append($runBtn);
				$buttonsWrapper.append($pauseBtn);
				$buttonsWrapper.append($remove);
				$settings.append($buttonsWrapper);

				cells.push($settings);
				var $row = addRow(cells);
				$row.data('id', task.id);
				if (task.pause){
					$row.addClass('paused-task');
					$status.text('Paused');
				}else{
					$row.addClass('active-task');
				}

				$imgWrapper.after($created);
				$imgWrapper2.after($lastCheck);
				// triggered time
				if (task['log_changed']) {
					$imgWrapper3.after($triggeredTimeWrapper);
				}
			});

			$('.edit-task-name').on('click', function() {
				var task = $(this).data('task');
				var $that = $(this);
				bootbox.prompt({
					size: "small",
					backdrop: true,
					title: "Change Task Name",
					placeholder: 'Enter a task name',
					value: task.name,
					buttons: {
						confirm: {
							label: 'Save',
							className: 'btn-primary'
						},
						cancel: {
							label: 'Cancel',
							className: 'btn-default'
						}
					},
					callback: function (newName) {
						if (newName) {
							var payload = {
								'name': newName
							}
							$.ajax ({
								url: "api/task/"+task.id+"/name",
								type: "PUT",
								data: JSON.stringify(payload),
								contentType: "application/json",
							}).done(
								function() {
									task.name = newName;
									$that.data('span').text(task.name);
								}
							);
						}

					}
				}).find('.modal-sm').css({
					'top': '30%'
				});
			});

			$('.delete-task').on('click', function() {
				var that = this;
				bootbox.confirm({
					size: "small",
					title: "Delete Task",
					backdrop: true,
					message: "Are you sure you want to delete this task? This cannot be undone.",
					buttons: {
						confirm: {
							label: 'Yes',
							className: 'btn-danger'
						},
						cancel: {
							label: 'No',
							className: 'btn-default'
						}
					},
					callback: function (confirm) {

						if (confirm) {
							$.ajax ({
								url: "api/task/"+$(that).closest('tr').data('id'),
								type: "DELETE",
								contentType: "application/json",
							}).done(
								function() {
									location.reload();
								}
							);
						};
					}
				}).find('.modal-sm').css({
					'top': '30%'
				});
			});

			$("#editROI").change( function(){
				$img = $("#enlargeImageModal img");
				if( $(this).is(':checked') ) {
					roiToggle = true;
					$('#update-roi-btn').show();
					updateROI($img);
				} else {
					roiToggle = false;
					$('#update-roi-btn').hide();
					updateROI($img); //may need to update, so call again here
				}
			});

			$('.screenshot').on("load", function(){
				console.log('loaded');
				$('#enlargeImageModal img').fadeIn('fast', function() {
					updateROI($(this));
				});

			});

			$('#update-roi-btn').on('click', function() {

				var $img = $('#enlargeImageModal img');
				var task = $img.data('imgNode').task;
				var payload = {
					'roi': selectedBox
				}
				$.ajax ({
					url: "api/task/"+task.id+"/roi",
					type: "POST",
					contentType: "application/json",
					data: JSON.stringify(payload),

				}).done(
					function(data) {
						task.roi = selectedBox;
						$("#editROI").prop('checked', false).change();
					}
				);
			});

			$('.cell img').on('click', function() {
				var $img = $(this);
				var node = $img.data('imgNode');
				updateEnlargeModal(node);
				$('#enlargeImageModal').modal('show');
			});

			$('.interval li').on('click', function() {
				interval = $(this).data('interval');
				var that = this;
				$.ajax ({
					url: "api/task/"+$(this).closest('tr').data('id')+'/interval/'+interval,
					type: "GET",
					contentType: "application/json",
				}).done(
					function(data) {
						$(that).closest('td').find('span.interval').text($(that).text());
					}
				);
			});

			$('.carousel-control').click(function(){
				changeImg($(this).hasClass('left'));
			});

			$(".modal").keydown(function(e) {
			  if(e.keyCode == 37) { // left
				changeImg(true);
			  }
			  else if(e.keyCode == 39) { // right
			  	changeImg(false);
			  }
			});

		}
	).fail(
		function() {

		}
	);


});
