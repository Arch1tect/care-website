(function($) {

// prettyPhoto
	jQuery(document).ready(function(){
		jQuery('a[data-gal]').each(function() {
			jQuery(this).attr('rel', jQuery(this).data('gal'));
		});



		jQuery("a[data-rel^='prettyPhoto']").prettyPhoto({animationSpeed:'slow',theme:'light_square',slideshow:false,overlay_gallery: false,social_tools:false,deeplinking:false});


		var addTask = function() {
			hideAlert();
			payload = {
				// 'name': 'yo',
				'interval': interval,
				'url': $('.care-url').val(),
			}
			$.ajax ({
				url: "api/task",
				type: "POST",
				data: JSON.stringify(payload),
				contentType: "application/json",
			}).done(
				function() {
					showAlert('success', 'Success!');
				}
			).fail(
				function() {
					showAlert('danger', 'Failed.');
				}
			);
		}

		var hideAlert = function() {
			$('.care-alert').removeClass('alert-success');
			$('.care-alert').removeClass('alert-danger');
			$('.care-alert').removeClass('alert-info');
			$('.care-alert').hide();
			$('.care-alert').text('no message');
		}

		var showAlert = function(type, text) {
			$('.care-alert').show();
			$('.care-alert').addClass('alert-' + type);
			$('.care-alert').text(text);
		}

		var takeScreenshot = function() {
			hideAlert();
			$('.screenshot').show();
			var url = $('.care-url').val()
			console.debug(url);
			$('.screenshot').attr("src", "assets/img/loading-squid.gif");	

			$.get("api/screenshot/"+url).done(
				function(screenshotName) {
					$('.screenshot').attr("src", "snapshot/" + screenshotName);
				}
			).fail(
				function() {
					$('.screenshot').hide();
					showAlert('danger', 'Failed.');
				}
			)
		}

		var interval = 300

		$(".searchbar input").on('keyup', function (e) {
			if (e.keyCode == 13) {
				takeScreenshot();
			}
		});

		$('button.add-task').click(function(){
			addTask();
		});

		$('button.take-screenshot').click(function(){
			takeScreenshot();
		});

		$('.interval li').click(function(){
			interval = $(this).data('interval');
			$('span.interval').text("Check every " + $(this).text());
		});















	}); 

		
})(jQuery);


