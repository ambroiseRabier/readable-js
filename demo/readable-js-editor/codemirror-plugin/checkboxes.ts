import {EditorView, Decoration} from "@codemirror/view"
import {syntaxTree} from "@codemirror/language"
import {CheckboxWidget} from './checkbox-widget';
import {generateCallStack} from '@readable-js/core';

export function checkboxes(view: EditorView, currentStep?: number) {
  let widgets = []

  // that won't be performant on large files, but that is not the purpose of readable-js
  const code = Array.from(
    view.state.doc.iterLines(1, view.state.doc.lines+1)
  ).join('\n');

  console.log(code);

  let calls: {
    loc: any; // SourceLocation
    range: [number, number];
    message: string;
  }[];

  try {
    calls = generateCallStack(code).calls as any;
  } catch (e) {
    // Syntax errors not yet handled
    console.warn(e);
  }

  if (calls) {
    // for (let i = 0; i < calls.length; i++) {
      const lineStart = calls[currentStep].loc.start.line;
      const rangeEnd = calls[currentStep].range[1];

      let deco = Decoration.widget({
        widget: new CheckboxWidget(calls[currentStep].message),
        side: 1
      })
      widgets.push(deco.range(rangeEnd))
    // }
  }




  // for (let {from, to} of view.visibleRanges) {



    // syntaxTree(view.state).iterate({
    //   from, to,
    //   enter: (node) => {
    //     if (node.name == "BooleanLiteral") {
    //       let isTrue = view.state.doc.sliceString(node.from, node.to) == "true"
    //       let deco = Decoration.widget({
    //         widget: new CheckboxWidget(isTrue),
    //         side: 1
    //       })
    //       widgets.push(deco.range(node.to))
    //     }
    //   }
    // })
  // }
  return Decoration.set(widgets)
}
