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
  message: [
    %60add add <span class='val'>1</span> to <span class='var'>i</span> and set <span class='var'>i</span> to <span class='val'>%24{i}</span>%60
  ],
  
  
});
`

    expect(r).toEqual(e);
  });

  it('i = i + 1 AssignmentExpression', function () {
    const r = insertSpies(`i+=1;`, helpfulTestOptions);
    const e =
      `i+=1;
;spy({
  
  evaluateVar: {
    i: i,
  },
  nodeCode: "i = i + 1;",
  message: [
    %60add add <span class='val'>1</span> to <span class='var'>i</span> and set <span class='var'>i</span> to <span class='val'>%24{i}</span>%60
  ],
  
  
});
`

    expect(r).toEqual(e);
  });

  it('i Identifier', function () {
    const r = insertSpies(`i;`, helpfulTestOptions);
    const e =
      `i;
;spy({
  
  
  nodeCode: "i;",
  message: [
    %60%60
  ],
  
  
});
`

    expect(r).toEqual(e);
  });

  it('1+1; ExpressionStatement', function () {
    const r = insertSpies(`1+1;`, helpfulTestOptions);
    const e =
      `1+1;
;spy({
  
  
  nodeCode: "1+1;",
  message: [
    %60%60
  ],
  
  
});
`

    expect(r).toEqual(e);
  });

});


describe('condition', () => {

  it('if', function () {
    const r = insertSpies(`
if (true) {
}  
`, helpfulTestOptions);

    const e =
`
if (true) {
;spy({
  ifConditionTest: true,
  
  nodeCode: "if (true) {
}",
  message: [
    \`Because\`
  ],
  
  
});

} else {

;spy({
  ifConditionTest: false,
  
  nodeCode: "if (true) {
}",
  message: [
    \`Skip because\`
  ],
  
  
});

}  
`

    expect(r).toEqual(e);
  });


  it('if...else', function () {
    const r = insertSpies(`
if (true) {
} else {
}
`, helpfulTestOptions);

    const e =
      `
if (true) {
;spy({
  ifConditionTest: true,
  
  nodeCode: "if (true) {
} else {
}",
  message: [
    \`Because\`
  ],
  
  
});

} else {
;spy({
  ifConditionTest: false,
  
  nodeCode: "if (true) {
} else {
}",
  message: [
    \`Skip because\`
  ],
  
  
});

}
`

    expect(r).toEqual(e);
  });


  it('if nested', function () {
    const r = insertSpies(`
if (true) {
  if (true) {
  }
}
`, helpfulTestOptions);

    const e =
      `if (true) {
        spy({
          ifConditionTest: true,

          nodeCode: %60if (true) {
  if (true) {
  }
}%60,
          message: [%60Because%60],
        });

        if (true) {
          spy({
            ifConditionTest: true,

            nodeCode: %60if (true) {
  }%60,
            message: [%60Because%60],
          });
        } else {
          spy({
            ifConditionTest: false,

            nodeCode: %60if (true) {
  }%60,
            message: [%60Skip because%60],
          });
        }
      } else {
        spy({
          ifConditionTest: false,

          nodeCode: %60if (true) {
  if (true) {
  }
}%60,
          message: [%60Skip because%60],
        });
      }
      `

    expect(prettier.format(r)).toEqual(prettier.format(unescape(e)));
  });


});
