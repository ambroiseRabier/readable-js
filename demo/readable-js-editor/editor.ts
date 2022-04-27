import {EditorState, EditorView, basicSetup} from "@codemirror/basic-setup";
import {javascript} from "@codemirror/lang-javascript";

// with workspaces, this import will use our local package ! (dist folder)
import {ReadableJS, generateCallStack} from "@readable-js/core";
import {checkboxPlugin} from './codemirror-plugin/checkbox-plugin';

let editor = new EditorView({
  state: EditorState.create({
    extensions: [checkboxPlugin, basicSetup, javascript()],
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

const $range = document.querySelector('#myRange');



console.log(ReadableJS);




