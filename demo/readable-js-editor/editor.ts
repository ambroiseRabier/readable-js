import {EditorState, EditorView, basicSetup} from "@codemirror/basic-setup";
import {javascript} from "@codemirror/lang-javascript";

// with workspaces, this import will use our local package ! (dist folder)
import {ReadableJS, generateCallStack} from "@readable-js/core";
import {readablePlugin} from './codemirror-plugin/readable-plugin';
import {ViewUpdate, } from '@codemirror/view';
import {Extension, Compartment} from "@codemirror/state"


const one = readablePlugin(() => callStack, 0);
const j = new Compartment()
const k = j.of([one])

let callStack = [];

let editor = new EditorView({
  state: EditorState.create({
    extensions: [
      k,
      basicSetup,
      javascript(),

      // seem to be called before the plugin, all good ?
      EditorView.updateListener.of((v: ViewUpdate) => {
        if (v.docChanged) {
          callStack = stateToCallStack(v.state);
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

  // The only way to tell the plugin to update, because external data has changed ?
  editor.dispatch({
    effects: j.reconfigure([readablePlugin(() => callStack, e.target.value)])
  });
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




