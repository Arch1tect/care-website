
$(document).on('keyup', '.reset-password-form input', function(e){

	if ($("#new-password").val() !== $("#confirm-new-password").val()) {
		$(".confirm-new-password-not-match").show();
	}else {
		$(".confirm-new-password-not-match").hide();
	}

});




jQuery(document).ready(function(){


	$(".change-password-btn").click(function() {

		var payload = {
			'old_password': $("#old-password").val(),
			'new_password': $("#new-password").val()
		}
		$.ajax ({
			url: "api/user/password",
			type: "PUT",
			data: JSON.stringify(payload),
			contentType: "application/json",
		}).done(function(res) {
			$('.alert').show();
			$('.alert').text(res);
			$('.alert').removeClass('alert-danger');
			$('.alert').addClass('alert-success');

		}).fail(function(error) {

			$('.alert').show();
			$('.alert').text(error.responseText);
			$('.alert').addClass('alert-danger');
			$('.alert').removeClass('alert-success');

		});



	});


});
