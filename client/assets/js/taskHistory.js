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
	$('.task-table tr').remove();
	var i = (pageNum-1)*pageSize;

	for (; i < Math.min(taskLogs.length, pageNum*pageSize); i++) {
		var taskLog = taskLogs[i];
		var cells = []

		// screenshot
		var $imgWrapper = $("<div class='cell'></div");
		var $initImg = $("<img></img>");
		$initImg.attr('src', 'screenshot/'+taskId+'-'+(i+1)+'.png');
		$imgWrapper.append($initImg);
		cells.push($imgWrapper);

		// change
		// var $settings = $("<div></div>");
		// var $url = $("<a>URL</a>");
		// $url.attr('href', task.url);
		// $url.attr('target', '_blank');
		// $settings.append($url);

		// cells.push($settings);

		addRow(cells);
		// created time
		var $created = $("<span></span>");
		var createdTime = new Date(taskLog.timestamp);
		$created.text(moment(createdTime).format('YY/MM/DD HH:mm:SS'));
		$imgWrapper.after($created);


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
		}
	).fail(
		function() {

		}
	);

});
