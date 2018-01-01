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
	if(c.w>10&&c.h>10)
		window.selectedBox = x1 + ' ' + y1 + ' ' + x2 + ' ' + y2;
};

function clearCoords()
{
	$('#coords input').val('');
};


(function($) {
	var takingScreemshot = false;
	var loadingImg = 'assets/img/loading-spinner.gif';
	var screenshotName = null;
	jQuery(document).ready(function(){

		$('.screenshot').on("load",function(){

			if ($('.screenshot').attr("src") == loadingImg)
				return;

			var naturalWidth = $('.screenshot')[0].naturalWidth;
			var naturalHeight = $('.screenshot')[0].naturalHeight;

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
			var payload = {
				// 'name': 'yo',
				'email': $('.user-email').val(),
				'screenshot': screenshotName,
				'interval': interval,
				'url': $('.care-url').val(),
				'roi': window.selectedBox,
			}
			$.ajax ({
				url: "api/task",
				type: "POST",
				data: JSON.stringify(payload),
				contentType: "application/json",
				dataType: 'json',
			}).done(
				function(data) {
					var msg = 'Success! You can manage your tasks <a href="/task.html">here</a>.';
					if (data['is_new_user'])
						msg = 'Success! Please check your inbox and confirm you own this email.';
					showAlert('success', msg);
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

		var showAlert = function(type, html) {
			$('.care-alert').show();
			$('.care-alert').addClass('alert-' + type);
			$('.care-alert').html(html);
		}

		var takeScreenshot = function() {
			hideAlert();

			if (takingScreemshot)
				return;

			if (window.jcrop_api) {
				console.log('remove jcrop');
				window.jcrop_api.destroy();
				$('.jcrop-holder').remove();
				window.selectedBox = null;
				$('.screenshot').removeAttr( 'style' );
			}
			$('.screenshot').show();
			var url = $('.care-url').val();
			console.debug(url);
			$('.screenshot').attr("src", loadingImg);	
			var payload = {
				'url': url
			}
			takingScreemshot = true;
			$('button.take-screenshot').prop("disabled",true);

			$.ajax ({
				url: "api/screenshot/url",
				type: "POST",
				data: JSON.stringify(payload),
				contentType: "application/json",
			}).done(function(imgName) {
				takingScreemshot = false;
				$('button.take-screenshot').prop("disabled", false);
				screenshotName = imgName;
				$('.screenshot').attr("src", s3_screenshot_url + screenshotName);
			}).fail(function(error) {
				takingScreemshot = false;
				$('button.take-screenshot').prop("disabled", false);
				$('.screenshot').hide();
				showAlert('danger', 'Failed - ' + error.statusText);
			});
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


