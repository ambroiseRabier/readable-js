import {EditorState, EditorView, basicSetup} from "@codemirror/basic-setup";
import {javascript} from "@codemirror/lang-javascript";

// with workspaces, this import will use our local package ! (dist folder)
import {ReadableJS, generateCallStack} from "@readable-js/core";
import {checkboxPlugin} from './codemirror-plugin/checkbox-plugin';
import {ViewUpdate, } from '@codemirror/view';
import {Extension, Compartment} from "@codemirror/state"

let currentCallStack = [];

const one = checkboxPlugin();
const j = new Compartment()
const k = j.of([one])


let editor = new EditorView({
  state: EditorState.create({
    extensions: [
      k,
      basicSetup,
      javascript(),
      EditorView.updateListener.of((v: ViewUpdate) => {
        if (v.docChanged) {
          console.log('change here')
          // Document changed
        }
      }),
    ],
  }),
  parent: document.body,
  dispatch: (...e) => {
    editor.update(e);

    // strange, typing is wrong ?
    // @ts-ignore
    // const code = editor.state.doc.text.join('\n');

    // let calls;
    //
    // try {
    //   calls = generateCallStack(code).calls;
    // } catch (e) {
    //   // Syntax errors not yet handled
    //   // console.warn(e);
    // }

    // console.log(
    //   calls
    // );
  },
});

const $range: HTMLInputElement = document.querySelector('#myRange');

$range.addEventListener('input', (e: any) => {
  console.log(e.target.value);
  console.log(e);

  editor.dispatch({
    effects: j.reconfigure([checkboxPlugin(e.target.value)])
  });

  // this could work with a timeout of 0 between each. To force update.
  // editor.dispatch(
  //   {
  //     changes: {from: editor.state.doc.length, to: editor.state.doc.length, insert: "n"},
  //     sequential: true,
  //   },
  //   {
  //     // editor.state.doc.length is stale data at this point, so we increment both by +1
  //     // Note: this change alone, would have from be `editor.state.doc.length -1`
  //     changes: {from: editor.state.doc.length, to: editor.state.doc.length+1, insert: ""},
  //     sequential: true,
  //   },
  // )
});


const stateToCallStack = (state: EditorState) => {
  // that won't be performant on large files, but that is not the purpose of readable-js
  const code = Array.from(
    state.doc.iterLines(1, state.doc.lines+1)
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

  return calls ?? [];
};



console.log(ReadableJS);




