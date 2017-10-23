
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
				$initImg.attr('src', 'snapshot/'+task.id+'-0.png');
				$imgWrapper.append($initImg);
				cells.push($imgWrapper);
				// last snapshot
				var $imgWrapper2 = $("<div class='cell'></div");
				var $lastImg = $("<img></img>");
				$lastImg.attr('src', 'snapshot/'+task.id+'-'+task.last_run_id+'.png');
				$imgWrapper2.append($lastImg);
				cells.push($imgWrapper2);
				// settings
				var $settings = $("<div></div>");

				var $url = $("<a>URL</a>");
				$url.attr('href', task.url);
				$url.attr('target', '_blank');
				$settings.append($url);

				var $interval = $("<div></div>");
				$interval.text('Check interval: ' + task.interval);
				$settings.append($interval);



				cells.push($settings);

				addRow(cells);
				// created time
				var $created = $("<span></span>");
				var createdTime = new Date(task.created);
				$created.text(createdTime.toLocaleString());
				$imgWrapper.after($created);
				// last check time
				var $lastCheck = $("<span></span>");
				var lastCheckTime = new Date(task.last_run_time);
				$lastCheck.text(lastCheckTime.toLocaleString());
				$imgWrapper2.after($lastCheck);

			});

	    	$('img').on('click', function() {
	    		$('.modal-title').text($(this).closest('td').find('span').text());
				$('.enlargeImageModalSource').attr('src', $(this).attr('src'));
				$('#enlargeImageModal').modal('show');
			});

		}
	).fail(
		function() {

		}
	);




});
