
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

				// initial image
				var $imgWrapper = $("<div class='cell'></div");
				var $initImg = $("<img></img>");
				$initImg.attr('src', 'screenshot/'+task.id+'-0.png');
				$imgWrapper.append($initImg);
				cells.push($imgWrapper);
				// last screenshot
				var $imgWrapper2 = $("<div class='cell'></div");
				var $lastImg = $("<img></img>");
				$lastImg.attr('src', 'screenshot/'+task.id+'-'+task.last_run_id+'.png');
				$imgWrapper2.append($lastImg);
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
				$history.text(' View history');
				$history.attr('href', 'task-history.html?id='+task.id)
				$historyWrapper.append($historyIcon);
				$historyWrapper.append($history);
				$settings.append($historyWrapper);

				var $removeWrapper = $("<div class='delete-task'></div>");
				var $crossIcon = $("<i class='fa fa-times fa-fw'></i>");
				var $remove = $("<a class='danger'> Delete task</a>");
				$removeWrapper.append($crossIcon);
				$removeWrapper.append($remove);
				$settings.append($removeWrapper);

				cells.push($settings);
				var $row = addRow(cells);
				$row.data('id', task.id);
				// created time
				var $created = $("<span class='friendly-time'></span>");
				var createdTime = new Date(task.created);
				$created.text(moment(createdTime).fromNow());
				$imgWrapper.after($created);
				// last check time
				var $lastCheck = $("<span class='friendly-time'></span>");
				var lastCheckTime = new Date(task.last_run_time);
				$lastCheck.text(moment(lastCheckTime).fromNow());
				$imgWrapper2.after($lastCheck);

			});


			$('.delete-task').on('click', function() {
				var that = this;
				bootbox.confirm({
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
				});

			});


			$('.cell img').on('click', function() {

				var initialImageCell = $(this).closest('tr').find('td')[0];
				var lastImageCell = $(this).closest('tr').find('td')[1];

				$('.modal-title.initial').text($(initialImageCell).find('span').text());
				$('.modal-title.last').text($(lastImageCell).find('span').text());
				$('.initialImageLarge').attr('src', $(initialImageCell).find('img').attr('src'));
				$('.lastImageLarge').attr('src', $(lastImageCell).find('img').attr('src'));
				$('#enlargeImageModal').modal('show');
			});

			$('.interval li').click(function(){
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

		}
	).fail(
		function() {

		}
	);




});
