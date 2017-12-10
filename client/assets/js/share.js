
function sessionActive() {
	$('.manage-link').removeClass('manage-link');
	$(".login-link").text('LOGOUT');
	$(".login-link").addClass('logout-link');
	$(".login-link").removeClass('login-link');
	$(".logout-link").on('click', function(){

		$.ajax ({
			url: "api/logout",
			type: "GET",
			contentType: "application/json",
		}).done(function(result) {
			window.location.href = '/';
		}).fail(function(error) {
			console.log('logout failed!');
		});

	});
}

jQuery(document).ready(function(){
	$.ajax ({
		url: "api/session",
		type: "GET",
		contentType: "application/json",
	}).done(function(result) {
		// logged in
		sessionActive();
	}).fail(function(error) {
		// not logged in
		$(".login-link").on('click', function(){
			// if (window.loginBox) { confirm button doesn't work
			// 	window.loginBox.modal('show');
			// 	return;
			// }
			window.loginBox = bootbox.confirm({
				title: "Login",
				size: "small",
				message: "<div class='login-form'><input class='email' placeholder='Email' name='email' type='text' /><br/><input type='password' class='password' placeholder='Password'/></div>",
				buttons: {
					cancel: {
						label: 'Cancel'
					},
					confirm: {
						label: 'Login'
					}
				},
				callback: function (result) {
					if (result) {
						var payload = {
							'email': $('input.email').val(),
							'password': $('input.password').val()
						}
						var noty = createNoty('Logging you in...');
						$.ajax ({
							url: "api/login",
							type: "POST",
							data: JSON.stringify(payload),
							contentType: "application/json",
						}).done(function(result) {
							closeNoty(noty,'success', 'Success!');
							window.loginBox.modal('hide');
							sessionActive();
							window.location.href = '/task.html';

						}).fail(function(error) {
							closeNoty(noty, 'error', error.statusText);
						});
						return false;//don't close until login success.
					}
				}
			});
		});

	});

});
