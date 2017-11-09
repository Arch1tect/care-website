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

function showImageInModal(time, url) {

	return function() {
		$('.modal-title').text(time);
		$('.imageLarge').attr('src', url);
		$('#enlargeImageModal').modal('show');
	}

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
		var formattedTime = moment(createdTime).format('YY/MM/DD HH:mm');
		$timeDiv.text(formattedTime);
		cells.push($timeDiv);

		// changed

		var $changeDiv = $("<div class='cell'></div>");
		if (taskLog.changed) {

			var $changedImg = $("<img></img>");
			var changedImgUrl = 'screenshot/change/'+taskId+'-'+taskLog.run_id+'.png';
			$changedImg.attr('src', changedImgUrl);
			$changedImg.click(showImageInModal(formattedTime, changedImgUrl));
			$changeDiv.append($changedImg);
		}else {
			// taskLog.changed can be null
			var changed = taskLog.changed === false ? "No" : "N/A";
			$changeDiv.text(changed);
		}
		cells.push($changeDiv);


		// screenshot btn
		var $btn = $("<button class='btn btn-primary'></button");
		$btn.text('View');
		var fullScreeshotUrl = 'screenshot/'+taskId+'-'+taskLog.run_id+'.png';
		$btn.click(showImageInModal(formattedTime, fullScreeshotUrl));
		cells.push($btn);

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
			taskLogs = data.reverse();
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
