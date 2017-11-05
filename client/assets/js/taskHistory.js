var pageSize = 5;
var pageNum = 1;
var totalPages = 1;
var taskLogs = [];
var taskId = null;

function addRow(cells) {
		
	var $row = $("<tr></tr>");
	$.each(cells, function(i, cell){
		var $td = $("<td></td");
		$td.append(cell);
		$row.append($td);
	});
	$('.task-table tbody').append($row);
}

function loadHisotry() {
	$(window).scrollTop(0);
	$('.task-table tbody tr').remove();
	var i = (pageNum-1)*pageSize;

	for (; i < Math.min(taskLogs.length, pageNum*pageSize); i++) {
		var taskLog = taskLogs[i];
		var cells = []


		// ID
		var $idDiv = $("<div></div>");
		$idDiv.text(taskLog.run_id);
		cells.push($idDiv);

		// Time
		var $timeDiv = $("<div></div>");
		var createdTime = new Date(taskLog.timestamp);
		$timeDiv.text(moment(createdTime).format('YY/MM/DD HH:mm'));
		cells.push($timeDiv);

		// screenshot
		var $imgWrapper = $("<div class='cell'></div");
		var $initImg = $("<img></img>");
		$initImg.attr('src', 'screenshot/'+taskId+'-'+taskLog.run_id+'.png');
		$imgWrapper.append($initImg);
		cells.push($imgWrapper);

		// changed
		var $changeDiv = $("<div></div>");
		$changeDiv.text(taskLog.changed);
		cells.push($changeDiv);

		addRow(cells);

	}

}

jQuery(document).ready(function(){
	taskId = window.location.search.substring(4)
	$.ajax ({
		url: "api/task/"+taskId,
		type: "GET",
		contentType: "application/json",
	}).done(
		function(data) {
			console.log(data);
			taskLogs = data;
			if (taskLogs.length > 0) {
				totalPages = Math.max(1, (taskLogs.length+1)/pageSize);
				$('.history-pagination').twbsPagination({
					totalPages: totalPages,
					visiblePages: 7,
					onPageClick: function (event, page) {
						console.log('go to page ' + page);
						pageNum = page;
						loadHisotry();
					}
				});

			} else {

				// TODO: show a message, job hasn't been ran

			}
		}
	).fail(
		function() {

		}
	);

});
