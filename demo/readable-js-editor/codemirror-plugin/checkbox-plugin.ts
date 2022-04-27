import {ViewUpdate, ViewPlugin, DecorationSet} from "@codemirror/view"
import {EditorView} from '@codemirror/basic-setup';
import {checkboxes} from './checkboxes';

function toggleBoolean(view: EditorView, pos: number) {
  let before = view.state.doc.sliceString(Math.max(0, pos - 5), pos)
  let change
  if (before == "false")
    change = {from: pos - 5, to: pos, insert: "true"}
  else if (before.endsWith("true"))
    change = {from: pos - 4, to: pos, insert: "false"}
  else
    return false
  view.dispatch({changes: change})
  return true
}

export const checkboxPlugin = ViewPlugin.fromClass(class {
  decorations: DecorationSet

  constructor(view: EditorView) {
    this.decorations = checkboxes(view)
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged)
      this.decorations = checkboxes(update.view);
  }
}, {
  decorations: v => v.decorations,

  // eventHandlers: {
  //   mousedown: (e, view) => {
  //     let target = e.target as HTMLElement;
  //     if (target.nodeName == "INPUT" &&
  //       target.parentElement!.classList.contains("cm-boolean-toggle"))
  //       return toggleBoolean(view, view.posAtDOM(target));
  //   }
  // }
})
