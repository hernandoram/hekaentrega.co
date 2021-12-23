export default class Stepper {
    constructor(form) {
        this.form = $(form);
        this.steps = $(".step", form);
        this.step = 0;
    }

    init() {
        this.buttonNext = $(".next", this.form);
        this.buttonPrev = $(".prev", this.form);
        this.buttonSubmit = $(".submit", this.form);
        this.steperView = $(".step-view", this.form);
        const cantSteps = this.steps.length;
        const widthViewerStep = cantSteps * 100;
        $(this.steps).filter(":not(.active)").css({transform: "scale(0.5)"});

        this.form.css({overflow: "hidden"});
        this.steperView.css({
            display: "flex",
            width: widthViewerStep + "%",
            transition: "margin-left ease-in .3s",
            alignItems: "start",
            overflow: "hidden"
        });
        this.steps.css({width: "100%", transition: "transform .3s"});

        this.buttonNext.click(() => this.next());
        this.buttonPrev.click(() => this.prev());
        this.form.click(() => this.awaitToNormalize(1000))
    }

    next() {
        const active = this.steps.filter(".active");
        const nextStep = active.next(".step");

        if(this.findErrorsBeforeNext(active)) {
            // this.normalize();
            return;
        };

        active.css({transform: "scale(0.5)"});
        this.moveTo(this.step + 1);
    }

    prev() {
        const active = this.steps.filter(".active");

        active.css({transform: "scale(0.5)"});
        this.moveTo(this.step - 1);
    }

    moveTo(step, callBack) {
        if(typeof step !== "number") step = step.index();
        this.step = step;
        const marginL = (-100 * step) + "%";

        this.steps.removeClass("active");
        $(this.steps[step]).css({transform: "scale(1)"});
        this.steperView.css({marginLeft: marginL});

        this.steps[step].classList.add("active");
        // callBack();
        this.normalize()
    }

    awaitToNormalize(delay = 800) {
        clearTimeout(this.toNormalize);
        this.toNormalize = setTimeout(() => {
            this.normalize();
        }, delay);
    }

    normalize() {
        const active = this.steps.filter(".active");
        const heightStep = active.height();
        const heightViewer = this.steperView.height();

        const steps = this.steps.length;
        const index = this.steps.index(active);

        if(!index) {
            this.buttonPrev.addClass("d-none");
            this.buttonSubmit.addClass("d-none");
            this.buttonNext.removeClass("d-none");
        } else if (index === steps - 1) {
            this.buttonNext.addClass("d-none");
            this.buttonSubmit.removeClass("d-none");
            this.buttonPrev.removeClass("d-none");
        } else {
            this.buttonNext.removeClass("d-none");
            this.buttonSubmit.addClass("d-none");
            this.buttonPrev.removeClass("d-none");
        }

        setTimeout(() => this.steperView.animate({height: heightStep}), 600);
    }

    showPagination(type) {
        const controllers = $(".step-controller", this.form);
        const div = document.createElement("div");
        const pages = document.createElement("div");

        div.classList.add("d-flex", "justify-content-center", "my-2");
        pages.setAttribute("class", "d-flex justify-content-around");

        this.steps.each((i, el) => {
            const bg = "bg-info";
            const page = document.createElement("a");
            const divisor = document.createElement("div");
            $(divisor).css({
                width: "15px",
                height: "2px",
                position: "relative",
                top: "13px",
                borderRadius: "3px"
            });
            $(divisor).addClass("bg-secondary")

            $(page).css({
                width: "26px",
                height: "26px",
                borderRadius: "26px",
                color: "#FFF",
                fontWeight: "400",
                cursor: "pointer"
            });
            $(page).text(i);

            $(page).addClass(bg + " step-link mx-2 d-flex align-items-center justify-content-center");
            page.onclick = () => this.moveTo(i, () => $(el).addClass("active"));
            pages.appendChild(page);
            if(i !== this.steps.length - 1) {
                pages.appendChild(divisor)
            }
        });

        div.appendChild(pages);
        controllers.before(div);
    }

    findErrorsBeforeNext(active) {
        return false
    }

}