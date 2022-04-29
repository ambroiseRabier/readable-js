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
    // const lineStart = calls[currentStep].loc.start.line;
    const rangeEnd = calls[currentStep].range[1];

    const decoColor = Decoration.line({
      attributes: {class: 'cm-readable-js-highlight'}
    });

    console.log(calls[currentStep].range[0]);


    // decoLine need the range starting from the start of the line (no indentation or other)
    let lineRangeStart = view.state.doc.lineAt(calls[currentStep].range[0]);
    let lineRangeEnd = view.state.doc.lineAt(calls[currentStep].range[1]);

    // if one instruction take multiple line, we want all the line to be colored
    // otherwise we could just do decoColor.range(lineRangeStart.from)
    for (let i = lineRangeStart.number; i <= lineRangeEnd.number; i++) {
      widgets.push(
        decoColor.range(view.state.doc.line(i).from)
      );
    }

    let decoText = Decoration.widget({
      widget: new ReadableWidget(calls[currentStep].message),
      side: 1
    });

    widgets.push(
      decoText.range(lineRangeEnd.to)
    );
  }

  return Decoration.set(widgets)
}
