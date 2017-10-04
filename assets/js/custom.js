(function($) {

// prettyPhoto
	jQuery(document).ready(function(){
		jQuery('a[data-gal]').each(function() {
			jQuery(this).attr('rel', jQuery(this).data('gal'));
		});  	
		jQuery("a[data-rel^='prettyPhoto']").prettyPhoto({animationSpeed:'slow',theme:'light_square',slideshow:false,overlay_gallery: false,social_tools:false,deeplinking:false});
	

		$('.care-capture-btn').click(function(){

			var url = $('.care-url').val()
			console.debug(url);
			$('.snapshot').attr("src", "http://localhost:8080/snapshot/"+url);	




			// $.get("http://localhost:8080/snapshot/"+url, function(data) {

			// 	console.log(data);
			// })


		});
















	}); 

		
})(jQuery);


