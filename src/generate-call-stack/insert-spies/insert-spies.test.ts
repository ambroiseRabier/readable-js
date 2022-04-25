import {insertSpies, Options} from './insert-spies';

// Note:
// - %24 == $
// - %60 == `

const helpfulTestOptions: Options =  {
  range: false,
  loc: false,
  classNames: {
    value: 'val',
    variable: 'var'
  },
}

describe('options', () => {
  it('have sensible defaults', function () {
    const r = insertSpies(`var i = 0;`);
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
  },
});
`

    // note: decodeURI seem to ignore some case (%24) here.
    expect(r).toEqual(unescape(e));
  });

  it('can change spy name', function () {
    const r = insertSpies(`var i = 0;`, {spyFcName: 'helloFC'});
    expect(r).toContain('helloFC(');
  });

  it('can insert custom spy', function () {
    const r = insertSpies(`var j = 1;`, {spyParamHook: e => e.range![1] + ''});
    const e =
      `var j = 1;
;spy(10);
`

    expect(r).toEqual(e);
  });

  it('can remove loc', function () {
    const r = insertSpies(`var i = 0;`, {loc: false});
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
  
});
`
    expect(r).toEqual(unescape(e));
  });

  it('can remove range', function () {
    const r = insertSpies(`var i = 0;`, {range: false});
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
  
  loc: {
    "start": {
      "line": 1,
      "column": 0
    },
    "end": {
      "line": 1,
      "column": 10
    }
  },
});
`
    expect(r).toEqual(unescape(e));
  });

  it('can change class names', function () {
    const r = insertSpies(`var i = 0;`, {
      range: false,
      loc: false,
      classNames: {
        value: 'val',
        variable: 'var'
      }
    });
    const e =
      `var i = 0;
;spy({
  
  evaluateVar: {
    i: i,
  },
  nodeCode: "var i = 0;",
  message: [
    %60Create the variable <span class='val'>i</span> and set it to <span class='var'>%24{i}</span>%60
  ],
  
  
});
`
  });

});


it('insert multiple spy', function () {
  const r = insertSpies(`var i = 0; var j = 0;`, {spyParamHook: node => ''});

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
    const r = insertSpies(`var i = 0, j = 1;`, helpfulTestOptions);
    const e =
      `var i = 0, j = 1;
;spy({
  
  evaluateVar: {
    i: i,
    j: j,
  },
  nodeCode: "var i = 0, j = 1;",
  message: [
    %60Create the variable <span class='var'>i</span> and set it to <span class='val'>%24{i}</span>%60,
    %60Create the variable <span class='var'>j</span> and set it to <span class='val'>%24{j}</span>%60
  ],
  
  
});
`

    expect(r).toEqual(unescape(e));
  });
});

describe('ExpressionStatement', () => {


  it('increment: i++; UpdateExpression', function () {
    const r = insertSpies(`i++;`, helpfulTestOptions);
    const e =
      `i++;
;spy({
  
  evaluateVar: {
    i: i,
  },
  nodeCode: "i++;",
  message: [
    %60increment <span class='readable-variable'>i</span> by <span class='readable-value'>1</span>%60
  ],
  
  
`

    expect(r).toEqual(e);
  });

  it('i+=1 AssignmentExpression', function () {
    const r = insertSpies(`i+=1;`, helpfulTestOptions);
    const e =
      `i+=1;
;spy({
  
  evaluateVar: {
    i: i,
  },
  nodeCode: "i+=1;",
  message: %60add add <span class='readable-value'>1</span> to <span class='readable-variable'>i</span> and set <span class='readable-variable'>i</span> to <span class='readable-value'>%24{i}</span>%60
  
  
});
`

    expect(r).toEqual(e);
  });

  it('i Identifier', function () {
    const r = insertSpies(`i;`, helpfulTestOptions);
    const e =
      `` // somewhat correct, but I dislike it

    expect(r).toEqual(e);
  });
});


describe('condition', () => {


  it('should insert spy with correct params for condition', function () {
    const r = insertSpies(`if (true) { 1+1 }`, helpfulTestOptions);
    const e =
`if (true) {
;spy({
  ifConditionTest: true,
  

});
 1+1 } else {

;spy({
  ifConditionTest: false,
  

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
`, helpfulTestOptions);

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
`, helpfulTestOptions);

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
`, helpfulTestOptions);

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
