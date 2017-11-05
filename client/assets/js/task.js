
function addRow(cells) {
		
	var $row = $("<tr></tr>");
	$.each(cells, function(i, cell){
		var $td = $("<td></td");
		$td.append(cell);
		$row.append($td);
	});
	$('.task-table tbody').append($row);
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
				var url = task.url;
				if (url.length > 25) {
					url = url.substring(0, 20) + '...';
				}
				$url.text(url);
				$url.attr('href', task.url);
				$url.attr('target', '_blank');
				$urlWrapper.append($urlIcon);
				$urlWrapper.append($url);
				$settings.append($urlWrapper);

				var $intervalWrapper = $("<div></div>");
				var $interval = $("<span></span>");
				var $clockIcon = $("<i class='fa fa-clock-o fa-fw'></i>");
				$intervalWrapper.append($clockIcon);
				$intervalWrapper.append($interval);
				$interval.text(task.interval);
				$settings.append($intervalWrapper);

				var $historyWrapper = $("<div></div>");
				var $historyIcon = $("<i class='fa fa-calendar fa-fw'></i>");

				var $history = $("<a></a>");
				$history.text('History');
				$history.attr('href', 'task-history.html?id='+task.id)
				$historyWrapper.append($historyIcon);
				$historyWrapper.append($history);
				$settings.append($historyWrapper);

				cells.push($settings);

				addRow(cells);
				// created time
				var $created = $("<span></span>");
				var createdTime = new Date(task.created);
				$created.text(moment(createdTime).fromNow());
				$imgWrapper.after($created);
				// last check time
				var $lastCheck = $("<span></span>");
				var lastCheckTime = new Date(task.last_run_time);
				$lastCheck.text(moment(lastCheckTime).fromNow());
				$imgWrapper2.after($lastCheck);

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

		}
	).fail(
		function() {

		}
	);




});
