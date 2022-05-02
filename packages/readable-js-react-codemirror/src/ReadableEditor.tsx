import React, {MutableRefObject, useEffect, useRef} from 'react';
import {DefaultSpyParams, generateCallStack} from '@readable-js/core';
import {basicSetup, EditorState, EditorView} from '@codemirror/basic-setup';
import {javascript} from '@codemirror/lang-javascript';
import {Compartment} from "@codemirror/state"
import {readablePlugin} from './codemirror-plugin/readable-plugin';



function stateToCode (state: EditorState): string {
  // that won't be performant on large files, but that is not the purpose of readable-js
  return Array.from(
    state.doc.iterLines(1, state.doc.lines+1)
  ).join('\n');
}

export function ReadableEditor(p: { initialCode: string; }) {
  const editorParentRef = useRef(null);
  const readableCompartment = useRef(new Compartment());
  const generated = useRef<{ calls: DefaultSpyParams[]; error: any; }>();

  const editor: MutableRefObject<EditorView|null> = useRef<EditorView|null>(
    null
  );
  
  useEffect(() => {
    console.log('ReadableEditor created');
    editor.current = new EditorView({
      state: EditorState.create({
        extensions: [
          basicSetup,
          javascript(),
          readableCompartment.current.of([readablePlugin(getUpdatedCallStack, 0)]),
        ],
        doc: p.initialCode
      }),
      parent: document.body,
      dispatch: (...e) => {
        console.log('dispatch');
        editor.current!.update(e);
      },
    })

    return () => {
      editor.current!.destroy();
    };
  });


  function getUpdatedCallStack(view: EditorView, skipEvaluation?: boolean): DefaultSpyParams[] {
    if (!skipEvaluation) {
      generated.current = generateCallStack(stateToCode(view.state));
    }

    if (!generated.current!.error) {
      // updateSlider(generated.current.calls.length);
    } else {
      console.warn(generated.current!.error);
    }

    return generated.current!.calls;
  }

  return (
    <div>
      <style>

      </style>
      <div ref={editorParentRef}/>
    </div>
  );
}
