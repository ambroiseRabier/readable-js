import {ViewUpdate, ViewPlugin, DecorationSet} from "@codemirror/view"
import {EditorView} from '@codemirror/basic-setup';
import {readableMessages} from './readableMessages';
import {DefaultSpyParams} from '@readable-js/core/dist/generate-call-stack/run-code-with-spy/insert-spies/insert-spies';


export const readablePlugin = (getCallStack: () => DefaultSpyParams[], currentStep?: number) => {
  return ViewPlugin.fromClass(class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = readableMessages(view, getCallStack, currentStep);
    }

    update(update: ViewUpdate) {
      console.log('readablePlugin');
      if (update.docChanged){
        this.decorations = readableMessages(update.view, getCallStack, currentStep);
      }
    }

  }, {
    decorations: v => v.decorations,
  });
}
