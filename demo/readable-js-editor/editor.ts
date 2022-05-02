import {EditorState, EditorView, basicSetup} from "@codemirror/basic-setup";
import {javascript} from "@codemirror/lang-javascript";

// with workspaces, this import will use our local package ! (dist folder)
import {generateCallStack} from "@readable-js/core";
import {readablePlugin} from './codemirror-plugin/readable-plugin';
import {ViewUpdate, } from '@codemirror/view';
import {Extension, Compartment} from "@codemirror/state"
import {DefaultSpyParams} from '@readable-js/core';


const $range: HTMLInputElement = document.querySelector('#myRange');
const $minValue: HTMLSpanElement = document.querySelector('.slide-container .min-value');
const $maxValue: HTMLSpanElement = document.querySelector('.slide-container .max-value');
const $currentValue: HTMLSpanElement = document.querySelector('.slide-container .current-value');

const one = readablePlugin(getUpdatedCallStack, 0);
const j = new Compartment()
const k = j.of([one])


const initialCode = `var i = 0;
i++;

function b () {
  i++;
}
b
  ();
  i++;
  
for (let i = 0; i < 2; i++) {
 1 + 1;
}

let j = 2;
while(j > 0) {
 j -= 1;
}



if (j == 0) {
 j += 1;
}

if (j == 0) {
 j += 1;
} else {
  2 + 2;
}
`;

let generated: { calls: DefaultSpyParams[]; error: any; };

function getUpdatedCallStack(view: EditorView, skipEvaluation?: boolean): DefaultSpyParams[] {
  if (!skipEvaluation) {
    generated = generateCallStack(stateToCode(view.state));
  }

  if (!generated.error) {
    updateSlider(generated.calls.length);
  } else {
    console.warn(generated.error);
  }

  return generated.calls;
}


let editor = new EditorView({
  state: EditorState.create({
    extensions: [
      basicSetup,
      javascript(),
      k,
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
  // The only way to tell the plugin to update, because external data has changed ?
  editor.dispatch({
    effects: j.reconfigure([readablePlugin(getUpdatedCallStack, e.target.value, true)])
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

function stateToCode (state: EditorState): string {
  // that won't be performant on large files, but that is not the purpose of readable-js
  return Array.from(
    state.doc.iterLines(1, state.doc.lines+1)
  ).join('\n');
}
