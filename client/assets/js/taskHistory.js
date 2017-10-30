
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
		url: "api/task/"+window.location.search.substring(4),
		type: "GET",
		contentType: "application/json",
	}).done(
		function(task) {
			console.log(task);
			var i = 0;
			for (; i <= task.last_run_id; i++) {
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
