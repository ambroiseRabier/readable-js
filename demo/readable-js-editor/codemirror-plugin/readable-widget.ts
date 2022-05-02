import {WidgetType} from "@codemirror/view";

export class ReadableWidget extends WidgetType {
  constructor(readonly message: string) {
    super();
  }

  eq(other: ReadableWidget) {
    return other.message == this.message;
  }

  toDOM() {
    let wrap = document.createElement("span");
    wrap.setAttribute("aria-hidden", "true");
    wrap.className = "cm-readable-js-message";
    wrap.innerHTML = this.message;

    return wrap;
  }
}
