import React, {useRef} from 'react';
import {ReadableEditor} from '@readable-js/react-codemirror';
import '@readable-js/react-codemirror/lib/ReadableEditor.css';

function App() {

  return (
    <div className="App">
      <h1>Demo readable-js with REACT with CodeMirror</h1>

      <ReadableEditor initialCode={"var i = 0;"}/>
    </div>
  );
}

export default App;
