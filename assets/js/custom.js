(function($) {

// prettyPhoto
	jQuery(document).ready(function(){
		jQuery('a[data-gal]').each(function() {
			jQuery(this).attr('rel', jQuery(this).data('gal'));
		});  	
		jQuery("a[data-rel^='prettyPhoto']").prettyPhoto({animationSpeed:'slow',theme:'light_square',slideshow:false,overlay_gallery: false,social_tools:false,deeplinking:false});
	

		$('.care-capture-btn').click(function(){

			$('.capture-failed').hide();
			$('.snapshot').show();

			var url = $('.care-url').val()
			console.debug(url);
			$('.snapshot').attr("src", "assets/img/loading-squid.gif");	

			$.get("api/snapshot/"+url).done(
				function(snapshotName) {
					$('.snapshot').attr("src", "snapshot/" + snapshotName);
				}
			).fail(
				function() {
					$('.snapshot').hide();
					$('.capture-failed').show();
				}
			)


		});
















	}); 

		
})(jQuery);


