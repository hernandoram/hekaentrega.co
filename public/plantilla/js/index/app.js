/* Template Name: Ubold - Bootstrap 4 Landing Page Tamplat
   Author: CoderThemes
   File Description: Main JS file of the template
*/


! function($) {
    "use strict";

    var Ubold = function() {};

    Ubold.prototype.initStickyMenu = function() {
        $(window).scroll(function() {
            var scroll = $(window).scrollTop();
        
            if (scroll >= 50) {
                $(".sticky").addClass("nav-sticky");
            } else {
                $(".sticky").removeClass("nav-sticky");
            }
        });
    },

    Ubold.prototype.initSmoothLink = function() {
        $('.navbar-nav a').on('click', function(event) {
            var $anchor = $(this);
            $('html, body').stop().animate({
                scrollTop: $($anchor.attr('href')).offset().top - 50
            }, 1500, 'easeInOutExpo');
            event.preventDefault();
        });
    },

    Ubold.prototype.initScrollspy = function() {
        $("#navbarCollapse").scrollspy({
            offset: 50
        });
    },

    Ubold.prototype.initContact = function() {
        
        $('#contact-form').submit(function() {

            var action = $(this).attr('action');
        
            $("#message").slideUp(750, function() {
                $('#message').hide();
        
                $('#submit')
                    .before('')
                    .attr('disabled', 'disabled');
        
                $.post(action, {
                        name: $('#name').val(),
                        email: $('#email').val(),
                        comments: $('#comments').val(),
                    },
                    function(data) {
                        document.getElementById('message').innerHTML = data;
                        $('#message').slideDown('slow');
                        $('#cform img.contact-loader').fadeOut('slow', function() {
                            $(this).remove()
                        });
                        $('#submit').removeAttr('disabled');
                        if (data.match('success') != null) $('#cform').slideUp('slow');
                    }
                );
        
            });
        
            return false;
        
        });
    },

    Ubold.prototype.initBacktoTop = function() {
        $(window).scroll(function(){
            if ($(this).scrollTop() > 100) {
                $('.back-to-top').fadeIn();
            } else {
                $('.back-to-top').fadeOut();
            }
        }); 
        $('.back-to-top').click(function(){
            $("html, body").animate({ scrollTop: 0 }, 1000);
            return false;
        });
    },


    Ubold.prototype.init = function() {
        this.initStickyMenu();
        this.initSmoothLink();
        this.initScrollspy();
        this.initContact();
        this.initBacktoTop();
    },
    //init
    $.Ubold = new Ubold, $.Ubold.Constructor = Ubold
}(window.jQuery),

//initializing
function($) {
    "use strict";
    $.Ubold.init();
}(window.jQuery);


//  ESCRITOR
(() => {
    const escritos = ["aumentar tus ventas", "hacer crecer tu negocio"];
    const escribiendo = $(".escribiendo");
    const timeWriting = 200;
    const timeWatching = 1000;
    
    incrementer();
    
    function incrementer(i= 0, n = 0, direction = 1) {
        const escrito = escritos[n];
        const l = escrito.length;
        const trozo = escrito.slice(0, i);
        
        escribiendo.text(trozo);

        i += direction;

        if(i <= -1) {
            if (n === escritos.length - 1) {
                n = 0;
            } else {
                n++;
            }

            setTimeout(() => incrementer(0, n, 1), timeWatching);
        } else if(i > l) {
            setTimeout(() => incrementer(i, n, -1), timeWatching);
        } else {
            setTimeout(() => incrementer(i + direction, n, direction), timeWriting);
        }
    }
})()