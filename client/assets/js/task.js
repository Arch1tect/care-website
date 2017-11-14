var screenshots = []
var rois = []
var screenshotTimes = []
var roiToggle = false;
var screenshotDisplayRatio = 1;
var selectedBox = null;


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

function removeROI() {
	if (window.jcrop_api) {
		console.log('remove jcrop');
		window.jcrop_api.destroy();
		$('.jcrop-holder').remove();
		selectedBox = null;
		screenshotDisplayRatio = 1;
		$(".screenshot").removeAttr( 'style' );
	}}

function getROI($img) {	
	var roiStr = $img.data('roi');
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
		$roiBox.hide();
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

function addROI($img) {

	if (! $('#enlargeImageModal').is(':visible')) {
		setTimeout(function() {
			addROI($img);
		}, 100);
	} else {
		showExistingROI($img);
		if (roiToggle) {
			editROI($img);
		}
	}
	
}

function testScreenshot(taskId) {
	return function() {
		$.ajax ({
			url: "api/task/"+taskId+'/screenshot',
			type: "GET",
			contentType: "application/json",
		}).done(function(screenshotName) {

			$('#testScreenshotModal img').attr('src', "screenshot/" + screenshotName);
			$('#testScreenshotModal').modal('show');

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


// Simple event handler, called from onChange and onSelect
// event handlers, as per the Jcrop invocation above
function showCoords(c)
{
	var x1 = parseInt(c.x*screenshotDisplayRatio);
	var y1 = parseInt(c.y*screenshotDisplayRatio);
	var x2 = parseInt(c.x2*screenshotDisplayRatio);
	var y2 = parseInt(c.y2*screenshotDisplayRatio);
	console.log('('+x1+' '+y1+'), ' + '('+x2+' '+y2+')');
	console.log('width: '+c.w+' height: '+c.h);
	if(c.w>10&&c.h>10) {
		selectedBox = x1 + ' ' + y1 + ' ' + x2 + ' ' + y2;
	}
};


jQuery(document).ready(function(){

	$.ajax ({
		url: "api/tasks/user/123",
		// url: "http://54.215.208.165/api/tasks/user/123",
		type: "GET",
		contentType: "application/json",
	}).done(
		function(data) {
			console.log(data);

			$.each(data, function(i, task){
				var cells = []

				var $status = $("<div class='task-status'>Active</div>");
				cells.push($status);

				// initial image
				var $imgWrapper = $("<div class='cell'></div");
				var $initImg = $("<img></img>");
				$initImg.attr('src', 'screenshot/'+task.id+'-0.png');
				screenshots.push($initImg.attr('src'));
				rois.push(task.roi);
				$imgWrapper.append($initImg);
				$initImg.data('roi', task.roi);
				cells.push($imgWrapper);
				// last screenshot
				var $imgWrapper2 = $("<div class='cell'></div");
				var $lastImg = $("<img></img>");
				$lastImg.attr('src', 'screenshot/'+task.id+'-'+task.last_run_id+'.png');
				screenshots.push($lastImg.attr('src'));
				$imgWrapper2.append($lastImg);
				$lastImg.data('roi', task.roi);
				rois.push(task.roi);
				cells.push($imgWrapper2);

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
				// created time
				var $created = $("<span class='friendly-time'></span>");
				var createdTime = new Date(task.created);
				$created.text(moment(createdTime).fromNow());
				screenshotTimes.push($created.text());
				$imgWrapper.after($created);
				// last check time
				var $lastCheck = $("<span class='friendly-time'></span>");
				var lastCheckTime = new Date(task.last_run_time);
				$lastCheck.text(moment(lastCheckTime).fromNow());
				screenshotTimes.push($lastCheck.text());
				$imgWrapper2.after($lastCheck);

			});


			$('.delete-task').on('click', function() {
				var that = this;
				bootbox.confirm({
					size: "small",
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

			$("#someSwitchOptionSuccess").change( function(){
				if( $(this).is(':checked') ) {
					roiToggle = true;
					$('#update-roi-btn').show();
					addROI($("#enlargeImageModal img"));
				} else {
					roiToggle = false;
					$('#update-roi-btn').hide();
					removeROI();
				}
			});

			$('.screenshot').on("load", function(){
				console.log('loaded');
				removeROI();
				$('#roi-box').hide();
				addROI($(this));
			});

			$('#update-roi-btn').on('click', function() {
				// TODO: need to clean up code first, 
				// use a variable to store task data, and maybe save in $(img).data
				// $.ajax ({
				// 	url: "api/task/"+???,
				// 	type: "POST",
				// 	contentType: "application/json",
				// })
			});

			$('.cell img').on('click', function() {
				$('#enlargeImageModal .modal-title').text($(this).closest('td').find('.friendly-time').text());
				$('#enlargeImageModal img').attr('src', $(this).attr('src'));
				$('#enlargeImageModal img').data('roi', $(this).data('roi'));
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
				var imageUrl = $('#enlargeImageModal img').attr('src');
				var i = $.inArray(imageUrl, screenshots);
				if ($(this).hasClass('left'))
					i--;
				else{
					i++;
					// when initial and last images are the same
					if (screenshots[i]==imageUrl)
						i++;
				}
				$('#enlargeImageModal img').attr('src', screenshots[i]);
				$('#enlargeImageModal img').data('roi', rois[i]);
				$('#enlargeImageModal .modal-title').text(screenshotTimes[i]);
			});
			

		}
	).fail(
		function() {

		}
	);




});
