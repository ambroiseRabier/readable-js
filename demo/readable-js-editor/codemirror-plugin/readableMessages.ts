import {EditorView, Decoration} from "@codemirror/view"
import {syntaxTree} from "@codemirror/language"
import {ReadableWidget} from './readable-widget';
import {generateCallStack} from '@readable-js/core';
import {RangeSetBuilder} from "@codemirror/state"

export function readableMessages(view: EditorView, getCallStack: () => any, currentStep?: number) {
  let widgets = []

  let calls: {
    loc: any; // SourceLocation
    range: [number, number];
    message: string;
  }[] = getCallStack();

  // one call at time, we don't display all of them, because their can be multiple calls
  // for the same line
  if (calls && calls.length > 0) {
    console.log(calls);
    const lineStart = calls[currentStep].loc.start.line;
    const rangeEnd = calls[currentStep].range[1];

    const decoLine = Decoration.line({
      attributes: {class: 'cm-readable-js-highlight'}
    });

    widgets.push(
      decoLine.range(calls[currentStep].range[0])
    );

    let deco = Decoration.widget({
      widget: new ReadableWidget(calls[currentStep].message),
      side: 1
    });

    widgets.push(deco.range(rangeEnd));
  }

  return Decoration.set(widgets)
}
