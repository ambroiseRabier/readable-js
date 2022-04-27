import {WidgetType} from "@codemirror/view";

export class CheckboxWidget extends WidgetType {
  constructor(readonly message: string) {
    super();
  }

  eq(other: CheckboxWidget) {
    return other.message == this.message;
  }

  toDOM() {
    let wrap = document.createElement("span");
    wrap.setAttribute("aria-hidden", "true");
    wrap.className = "cm-boolean-toggle";
    wrap.innerHTML = this.message;

    return wrap;
  }

  ignoreEvent() {
    return false;
  }
}
