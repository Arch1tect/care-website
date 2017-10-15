// Simple event handler, called from onChange and onSelect
// event handlers, as per the Jcrop invocation above
function showCoords(c)
{
	// $('#x1').val(c.x);
	// $('#y1').val(c.y);
	// $('#x2').val(c.x2);
	// $('#y2').val(c.y2);
	// $('#w').val(c.w);
	// $('#h').val(c.h);
	var x1 = parseInt(c.x);
	var y1 = parseInt(c.y);
	var x2 = parseInt(c.x2);
	var y2 = parseInt(c.y2);
	console.log('('+x1+' '+y1+'), ' + '('+x2+' '+y2+')');
	console.log('width: '+c.w+' height: '+c.h);
	window.selectedBox = x1 + ' ' + y1 + ' ' + x2 + ' ' + y2;
};

function clearCoords()
{
	$('#coords input').val('');
};


(function($) {

	var loadingImg = 'assets/img/loading-squid.gif';

	jQuery(document).ready(function(){


		$('.screenshot').load(function() {

			if ($('.screenshot').attr("src") == loadingImg)
				return;

			var naturalWidth = $('.screenshot')[0].naturalWidth
			var naturalHeight = $('.screenshot')[0].naturalHeight

			$('.screenshot').Jcrop({
				trueSize: [naturalWidth, naturalHeight],
				onChange:   showCoords,
				onSelect:   showCoords,
				onRelease:  clearCoords
			},function(){
				console.log('start jcrop')
				window.jcrop_api = this;
			});

	    });

		var addTask = function() {
			hideAlert();
			payload = {
				// 'name': 'yo',
				'interval': interval,
				'url': $('.care-url').val(),
				'roi': window.selectedBox,
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
			if (window.jcrop_api) {
				console.log('remove jcrop');
				window.jcrop_api.destroy();
				$('.jcrop-holder').remove();
				window.selectedBox = null;
				$('.screenshot').removeAttr( 'style' );
			}
			$('.screenshot').show();
			var url = $('.care-url').val()
			console.debug(url);
			$('.screenshot').attr("src", loadingImg);	

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



		window.jcrop_api = null;


		$('#coords').on('change','input',function(e){
		  var x1 = $('#x1').val(),
			  x2 = $('#x2').val(),
			  y1 = $('#y1').val(),
			  y2 = $('#y2').val();
		  window.jcrop_api.setSelect([x1,y1,x2,y2]);
		});




	}); 

		
})(jQuery);


