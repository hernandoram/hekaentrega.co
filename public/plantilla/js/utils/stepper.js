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
        const widthViewerStep = 200;
        const noActive = this.steps.filter(":not(.active)")
        noActive.css({transform: "scale(0.5)", display: "none"});

        this.form.css({overflow: "hidden"});
        this.steperView.css({
            display: "flex",
            width: widthViewerStep + "%",
            // transition: "margin-left ease-in .3s",
            alignItems: "start",
            overflow: "hidden"
        });
        this.steps.css({width: "50%", transition: "transform .3s"});
        // $(".step-controller", this.form).appendTo(this.steps[this.step]);


        this.buttonNext.click(() => this.next());
        this.buttonPrev.click(() => this.prev());
        this.form.click(() => this.awaitToNormalize(1000));
        this.form.on("keypress", e => {
            if(e.target.nodeName === "INPUT" 
            && e.keyCode === 13 
            && this.step !== this.steps.length - 1) 
            e.preventDefault();
        });
        $(".next,.prev,.submit",this.form).on("keydown", e => {
            if(e.key === "Tab" && !e.shiftKey) {
                // e.preventDefault();
            }
        })
    }

    next() {
        const active = this.steps.filter(".active");

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
        const direction = step > this.step ? -1 : 0
        if(step === this.step) return;
        this.step = step;
        const marginL = (direction * 100) + "%";

        const toActive = this.steps[step];

        this.steps.removeClass("active");
        toActive.classList.add("active");

        if(!direction) this.steperView.css({marginLeft: "-100%"});

        $(toActive).css({transform: "scale(1)", display: "block"});
        this.steperView.animate({marginLeft: marginL}, 400, () => {
            this.steps.filter(":not(.active)").css({display: "none"});
            this.steperView.css({marginLeft: 0});
        });

        if(toActive.querySelector("input"))
        toActive.querySelector("input").focus({preventScroll: true});

        // callBack();

        // $(".step-controller", this.form).appendTo(this.steps[step]);
        this.normalize()
        this.onAfterChange(step);
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
            this.buttonPrev.hide();
            this.buttonSubmit.hide();
            this.buttonNext.show("fast");
        } else if (index === steps - 1) {
            this.buttonNext.hide();
            this.buttonSubmit.show("fast");
            this.buttonPrev.show("fast");
        } else {
            this.buttonNext.show("fast");
            this.buttonSubmit.hide();
            this.buttonPrev.show("fast");
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

    onAfterChange(step) {
        return (step) => false;
    }


}