export default class CreateModal {
  constructor(opts) {
    this.title = opts.title;
    this.btnContinueText = opts.btnContinueText;
    this.btnContinueColor = opts.btnContinueColor;
    this.btnCloseText = opts.btnCloseText;
    this.modalSize = opts.modalSize;
    this.id = opts.id || "modal-creado";
  }

  set init(body = "") {
    const title = this.title || "Título";

    this.modal = new DOMParser().parseFromString(
      `<div class="modal fade" style="top:100px" id="${this.id}" 
            tabindex="-1" aria-labelledby="titulo-${
              this.id
            }" aria-hidden="true">
            <div class="modal-dialog ${this.modalSize || ""}">
            <div class="modal-content">
                <div class="modal-header">
                <h5 class="modal-title" id="titulo-${this.id}">${title}</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
                </div>
                <div class="modal-body" id="cuerpo-${this.id}">
                    ${body}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn  ${
                      this.btnContinueColor === "red"
                        ? "btn-danger"
                        : "btn-primary"
                    } " id="btn-continuar-${this.id}">${
        this.btnContinueText || "Continuar"
      }</button>
                </div>
            </div>
            </div>
        </div>`,
      "text/html"
    ).body.children[0];

    let m = $(this.modal);

    m.on("hidden.bs.modal", function (event) {
      this.remove();
    });

    document.body.append(this.modal);
    m.modal();
  }

  /**
   * @param {Function} fn
   */
  set onSubmit(fn) {
    this.btnContinue.addEventListener("click", fn);
  }

  get btnContinue() {
    return this.modal.querySelector("#btn-continuar-" + this.id);
  }

  close() {
    $(this.modal).modal("hide");
  }
}
