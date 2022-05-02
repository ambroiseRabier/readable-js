import React, {MutableRefObject, useCallback, useEffect, useRef} from 'react';
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


function _ReadableEditor(p: { initialCode: string; }) {
  const editorParentRef = useRef(null);
  const readableCompartment = useRef(new Compartment());
  const generated = useRef<{ calls: DefaultSpyParams[]; error: any; }>();
  const editor: MutableRefObject<EditorView|null> = useRef<EditorView|null>(
    null
  );
  const $range = useRef<HTMLInputElement>(null);
  const $minValue = useRef<HTMLSpanElement>(null);
  const $maxValue = useRef<HTMLSpanElement>(null);
  const $currentValue = useRef<HTMLSpanElement>(null);

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
      parent: editorParentRef.current!,
      dispatch: (...e) => {
        console.log('dispatch');
        editor.current!.update(e);
      },
    });

    return () => {
      editor.current!.destroy();
    };
  }, []);



  function getUpdatedCallStack(view: EditorView, skipEvaluation?: boolean): DefaultSpyParams[] {
    if (!skipEvaluation) {
      generated.current = generateCallStack(stateToCode(view.state));
    }

    if (!generated.current!.error) {
      updateSlider(generated.current!.calls.length);
    } else {
      console.warn(generated.current!.error);
    }

    return generated.current!.calls;
  }

  function updateSlider(length: number) {
    $range.current!.setAttribute('min', '0');
    $range.current!.setAttribute('max', (length-1) + '');
    $range.current!.setAttribute('value', Math.min(parseInt($range.current!.value), length-1) + '');
    $minValue.current!.innerText = '1';
    $maxValue.current!.innerText = length + '';
    $currentValue.current!.innerText = (Math.min(parseInt($range.current!.value), length-1) + 1) + '';
  }

  const onInput = useCallback((e) => {
    // The only way to tell the plugin to update, because external data has changed ?
    editor.current!.dispatch({
      effects: readableCompartment.current.reconfigure([
        readablePlugin(getUpdatedCallStack, e.target.value, true)
      ])
    });
  }, []);

  return (
    <div>
      <div className="slide-container">
        <div>
          Current step: <span className="current-value" ref={$currentValue}/>
        </div>
        <span className="min-value" ref={$minValue}/>
        <input type="range"
               defaultValue="0"
               className="slider"
               id="myRange"
               onInput={onInput}
               ref={$range}
        />
        <span className="max-value" ref={$maxValue}/>
      </div>

      <div ref={editorParentRef}/>
    </div>
  );
}

const ReadableEditor = React.memo(
  _ReadableEditor,
  (props, nextProps) => {
  return true; // stop ReadableEditor from re-rendering
})

export {
  ReadableEditor
}
