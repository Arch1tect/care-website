var pageSize = 5;
var pageNum = 1;
var totalPages = 1;
var task = {};

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

	for (; i <= Math.min(task.last_run_id, pageNum*pageSize-1); i++) {
		var cells = []

		// initial image
		var $imgWrapper = $("<div class='cell'></div");
		var $initImg = $("<img></img>");
		$initImg.attr('src', 'screenshot/'+task.id+'-'+i+'.png');
		$imgWrapper.append($initImg);
		cells.push($imgWrapper);

		// change
		var $settings = $("<div></div>");
		var $url = $("<a>URL</a>");
		$url.attr('href', task.url);
		$url.attr('target', '_blank');
		$settings.append($url);

		cells.push($settings);

		addRow(cells);
		// // created time
		// var $created = $("<span></span>");
		// var createdTime = new Date(task.created);
		// $created.text(moment(createdTime).fromNow());
		// $imgWrapper.after($created);


	}

}

jQuery(document).ready(function(){
	$.ajax ({
		url: "api/task/"+window.location.search.substring(4),
		type: "GET",
		contentType: "application/json",
	}).done(
		function(data) {
			console.log(data);
			task = data;
			totalPages = Math.max(1, (task.last_run_id+1)/pageSize);
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
