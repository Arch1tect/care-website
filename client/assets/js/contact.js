(function($) {

	jQuery(document).ready(function(){
		$('.send-feedback').click(function(){


			var payload = {
				'email': $('.user-email').val(),
				'subject': $('.email-subject').val(),
				'name': $('.user-name').val(),
				'msg': $('.email-msg').val(),
			}
			var noty = createNoty('Sending message...');

			$.ajax ({
				url: "api/feedback",
				type: "POST",
				data: JSON.stringify(payload),
				contentType: "application/json",
			}).done(
				function(data) {
					closeNoty(noty, 'success', 'Message received. Thank you!');
				}
			).fail(
				function(error) {
					console.log(error)
					closeNoty(noty, 'error', error.responseText);
				}
			);



		});

	}); 
})(jQuery);
