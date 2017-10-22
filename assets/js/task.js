
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
				// last check time
				var $lastCheck = $("<span></span>");
				var lastCheckTime = new Date(task.last_run_time);
				$lastCheck.text(lastCheckTime.toLocaleString());
				cells.push($lastCheck);
				// created time
				var $created = $("<span></span>");
				var createdTime = new Date(task.created);
				$created.text(createdTime.toLocaleString());
				cells.push($created);

				addRow(cells);


			});

	    	$('img').on('click', function() {
				$('.enlargeImageModalSource').attr('src', $(this).attr('src'));
				$('#enlargeImageModal').modal('show');
			});

		}
	).fail(
		function() {

		}
	);




});
