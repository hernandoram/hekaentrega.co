const intersectionObserver = new IntersectionObserver(function(entries, observer) {
    entries.forEach((entry) => {
        const { target, isIntersecting } = entry;
        const element = $(target);
        const animation = element.attr("data-animate");

        if(isIntersecting && !element.hasClass("animated")) {

            element.animate({opacity: 1}).addClass("animated " + animation);
        }

        if(element.hasClass("animated"))
            observer.unobserve(target);
    })
}, {
    threshold: 0.25
})


document.querySelectorAll("[data-animate]").forEach(el => {
    $(el).css({opacity: 0});

    intersectionObserver.observe(el);
})