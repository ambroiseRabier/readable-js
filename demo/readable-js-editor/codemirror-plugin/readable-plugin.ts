import {ViewUpdate, ViewPlugin, DecorationSet} from "@codemirror/view"
import {EditorView} from '@codemirror/basic-setup';
import {readableMessages} from './readableMessages';


export const readablePlugin = (getCallStack: () => any, currentStep?: number) => {
  return ViewPlugin.fromClass(class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = readableMessages(view, getCallStack, currentStep);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged){
        this.decorations = readableMessages(update.view, getCallStack, currentStep);
      }
    }

  }, {
    decorations: v => v.decorations,
  });
}
