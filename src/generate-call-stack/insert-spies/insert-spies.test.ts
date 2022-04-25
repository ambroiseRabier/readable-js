import {insertSpies} from './insert-spies';

// Note:
// - %24 == $
// - %60 == `


it('should insert spy with correct params', function () {
  const r = insertSpies(`var i = 0;`, 'spy');
  const e =
`var i = 0;
;spy({
  
  evaluateVar: {
    i: i,
  },
  nodeCode: "var i = 0;",
  message: [
    %60Create the variable <span class='readable-variable'>i</span> and set it to <span class='readable-value'>%24{i}</span>%60
  ],
  range: [0, 10],
  loc: {
    "start": {
      "line": 1,
      "column": 0
    },
    "end": {
      "line": 1,
      "column": 10
    }
  }
});
`

  // note: decodeURI seem to ignore some case (%24) here.
  expect(r).toEqual(unescape(e));
});

it('should insert custom spy', function () {
  const r = insertSpies(`var j = 1;`, 'spy', e => e.range![1] + '');
  const e =
`var j = 1;
;spy(10);
`

  expect(r).toEqual(e);
});

it('insert multiple spy', function () {
  const r = insertSpies(`var i = 0; var j = 0;`, 'spy', node => '');

  const e =
`var i = 0;
;spy();
 var j = 0;
;spy();
`

  expect(r).toEqual(e);
})


describe('variable', () => {
  it('multiple declarations: var i = 0, j = 1;', function () {
    const r = insertSpies(`var i = 0, j = 1;`, 'spy');
    const e =
      `var i = 0, j = 1;
;spy({
  
  evaluateVar: {
    i: i,
    j: j,
  },
  nodeCode: "var i = 0, j = 1;",
  message: [
    %60Create the variable <span class='readable-variable'>i</span> and set it to <span class='readable-value'>%24{i}</span>%60,
    %60Create the variable <span class='readable-variable'>j</span> and set it to <span class='readable-value'>%24{j}</span>%60
  ],
  range: [0, 17],
  loc: {
    "start": {
      "line": 1,
      "column": 0
    },
    "end": {
      "line": 1,
      "column": 17
    }
  }
});
`

    expect(r).toEqual(e);
  });
});

describe('ExpressionStatement', () => {


  it('increment: i++; UpdateExpression', function () {
    const r = insertSpies(`i++;`, 'spy');
    const e =
      `i++;
;spy({
  
  evaluateVar: {
i: i,
},
  nodeCode: "i++;",
  range: [0, 4],
  loc: {
    "start": {
      "line": 1,
      "column": 0
    },
    "end": {
      "line": 1,
      "column": 4
    }
  }
});
`

    expect(r).toEqual(e);
  });

  it('i+=1 AssignmentExpression', function () {
    const r = insertSpies(`i+=1;`, 'spy');
    const e =
      `i+=1;
;spy({
  
  evaluateVar: {
i: i,
},
  nodeCode: "i+=1;",
  range: [0, 5],
  loc: {
    "start": {
      "line": 1,
      "column": 0
    },
    "end": {
      "line": 1,
      "column": 5
    }
  }
});
`

    expect(r).toEqual(e);
  });

  it('i Identifier', function () {
    const r = insertSpies(`i;`, 'spy');
    const e =
      `` // somewhat correct, but I dislike it

    expect(r).toEqual(e);
  });
});


describe('condition', () => {


  it('should insert spy with correct params for condition', function () {
    const r = insertSpies(`if (true) { 1+1 }`, 'spy');
    const e =
`if (true) {
;spy({
  ifConditionTest: true,
  
  range: [0, 17],
  loc: {
    "start": {
      "line": 1,
      "column": 0
    },
    "end": {
      "line": 1,
      "column": 17
    }
  }
});
 1+1 } else {

;spy({
  ifConditionTest: false,
  
  range: [0, 17],
  loc: {
    "start": {
      "line": 1,
      "column": 0
    },
    "end": {
      "line": 1,
      "column": 17
    }
  }
});

}`

    expect(r).toEqual(e);
  });


  it('if', function () {
    const r = insertSpies(`
let i = 0;
if (true) {
  i++;
}  
`, 'spy', node => '');

    const e =
`
let i = 0;
;spy();

if (true) {
;spy();

  i++;
} else {

;spy();

}  
`

    expect(r).toEqual(e);
  });


  it('if...else', function () {
    const r = insertSpies(`
let i = 0;
if (true) {
  i++;
} else {
  i--;
}
`, 'spy', node => '');

    const e =
      `

;spy();
let i = 0;

;spy();
if (true) {
  
;spy();
i++;
} else {
  
;spy();
i--;
}
`

    expect(r).toEqual(e);
  });


  it('if nested', function () {
    const r = insertSpies(`
let i = 0;
if (true) {
  if (true) {
    i++;
  }
}
`, 'spy', node => '');

    const e =
      `
let i = 0;
;spy();

if (true) {
;spy();

  if (true) {
;spy();

    i++;
  } else {

;spy();

}
} else {

;spy();

}
`

    expect(r).toEqual(e);
  });


});
