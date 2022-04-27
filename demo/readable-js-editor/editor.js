import {EditorState, EditorView, basicSetup} from "@codemirror/basic-setup";
import {javascript} from "@codemirror/lang-javascript";
// import {ReadableJS} from "@readable-js/core";
import {ReadableJS} from "@readable-js/core";

let editor = new EditorView({
  state: EditorState.create({
    extensions: [basicSetup, javascript()],
  }),
  parent: document.body,
});

const $range = document.querySelector('#myRange');

console.log(ReadableJS);


// console.log(generateCallStack('var i = 0;'));
