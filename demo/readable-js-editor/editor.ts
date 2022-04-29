import {EditorState, EditorView, basicSetup} from "@codemirror/basic-setup";
import {javascript} from "@codemirror/lang-javascript";

// with workspaces, this import will use our local package ! (dist folder)
import {ReadableJS, generateCallStack} from "@readable-js/core";
import {readablePlugin} from './codemirror-plugin/readable-plugin';
import {ViewUpdate, } from '@codemirror/view';
import {Extension, Compartment} from "@codemirror/state"


const $range: HTMLInputElement = document.querySelector('#myRange');
const $minValue: HTMLSpanElement = document.querySelector('.slide-container .min-value');
const $maxValue: HTMLSpanElement = document.querySelector('.slide-container .max-value');
const $currentValue: HTMLSpanElement = document.querySelector('.slide-container .current-value');

const one = readablePlugin(() => callStack, 0);
const j = new Compartment()
const k = j.of([one])

let callStack = [];

const initialCode = `var i = 0;
i++;

function b () {
  i++;
}
b
  ();
  i++;`;

let error = false;

try {
  callStack = generateCallStack(initialCode).calls as any;
} catch (e) {
  // Syntax errors not yet handled
  console.warn(e);
  error = true;
}

if (!error) {
  updateSlider(callStack.length);
}

let editor = new EditorView({
  state: EditorState.create({
    extensions: [
      k,
      basicSetup,
      javascript(),

      // need to call this code at startup
      // seem to be called before the plugin, all good ?
      EditorView.updateListener.of((v: ViewUpdate) => {
        if (v.docChanged) {
          const s = stateToCallStack(v.state);
          callStack = s.calls;

          if (!s.error) {
            updateSlider(callStack.length);
          }
        }
      }),
    ],
    doc: initialCode
  }),
  parent: document.body,
  dispatch: (...e) => {
    console.log('dispatch');
    editor.update(e);
  },
});

$range.addEventListener('input', (e: any) => {
  $currentValue.innerText = (parseInt(e.target.value)+1) + '';

  // The only way to tell the plugin to update, because external data has changed ?
  editor.dispatch({
    effects: j.reconfigure([readablePlugin(() => callStack, e.target.value)])
  });
});

function updateSlider(length: number) {
  $range.setAttribute('min', '0');
  $range.setAttribute('max', (length-1) + '');
  $range.setAttribute('value', Math.min(parseInt($range.value), length-1) + '');
  $minValue.innerText = '1';
  $maxValue.innerText = length + '';
  $currentValue.innerText = (Math.min(parseInt($range.value), length-1) + 1) + '';
}

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

  let error = false;

  try {
    calls = generateCallStack(code).calls as any;
  } catch (e) {
    // Syntax errors not yet handled
    console.warn(e);
    error = true;
  }

  return {
    error: error,
    calls: calls ?? [],
  };
};

