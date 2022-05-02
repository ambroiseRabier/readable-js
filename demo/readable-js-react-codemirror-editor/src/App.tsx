import React from 'react';
import {ReadableEditor} from '@readable-js/react-codemirror';
import '@readable-js/react-codemirror/lib/ReadableEditor.css';

function App() {

  return (
    <div className="App">
      <ReadableEditor initialCode={"var i = 0;"}/>
    </div>
  );
}

export default App;
