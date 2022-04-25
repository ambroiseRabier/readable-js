import {insertSpies, Options} from './insert-spies';
import * as prettier from 'prettier';


const helpfulTestOptions: Options = {
  range: false,
  loc: false,
  classNames: {
    value: 'val',
    variable: 'var'
  },
};

// use default formatter (prettier insist)
const pFormat = (code: string) => prettier.format(code, {parser: 'babel'});

// prettier is not perfect for that purpose, it does preserve some spacing
const expectCodeToSpies = (code: string, beEqualTo: string) => {
  try {
    expect(
      pFormat(insertSpies(code, helpfulTestOptions))
    ).toEqual(
      pFormat(beEqualTo)
    );
  } catch (e) {
    // try to catch formatting error, hard to debug with what prettier give us.
    if (typeof e == 'string' && e.includes('Error')) {
      console.warn("format didn't work");
      console.warn(e);
      expect(
        insertSpies(code, helpfulTestOptions)
      ).toEqual(
        "Error: Formatting issue, probably invalid code somewhere.\n\n" + beEqualTo
      );
    } else {
      // else leave the error as it is.
      throw e;
    }
  }
};


describe('options', () => {
  it('have sensible defaults', function () {
    const r = insertSpies(`var i = 0;`);
    const e =
      `var i = 0;
;spy({
  
  evaluateVar: {
    i: i,
  },
  nodeCode: \`var i = 0;\`,
  message: [
    \`Create the variable <span class='readable-variable'>i</span> and set it to <span class='readable-value'>\${i}</span>\`
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
`;

    expect(r).toEqual(e);
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
`;

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
  nodeCode: \`var i = 0;\`,
  message: [
    \`Create the variable <span class='readable-variable'>i</span> and set it to <span class='readable-value'>\${i}</span>\`
  ],
  range: [0, 10],
  
});
`;
    expect(r).toEqual(e);
  });

  it('can remove range', function () {
    const r = insertSpies(`var i = 0;`, {range: false});
    const e =
      `var i = 0;
;spy({
  
  evaluateVar: {
    i: i,
  },
  nodeCode: \`var i = 0;\`,
  message: [
    \`Create the variable <span class='readable-variable'>i</span> and set it to <span class='readable-value'>\${i}</span>\`
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
`;
    expect(r).toEqual(e);
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
    \`Create the variable <span class='val'>i</span> and set it to <span class='var'>\${i}</span>\`
  ],
  
  
});
`;
  });

});


it('insert multiple spy', function () {
  const r = insertSpies(`var i = 0; var j = 0;`, {spyParamHook: node => ''});

  const e =
    `var i = 0;
;spy();
 var j = 0;
;spy();
`;

  expect(r).toEqual(e);
});


describe('variable', () => {
  it('multiple declarations: var i = 0, j = 1;', function () {
    expectCodeToSpies(`var i = 0, j = 1;`, `
      var i = 0, j = 1;
      ;spy({
        
        evaluateVar: {
          i: i,
          j: j,
        },
        nodeCode: \`var i = 0, j = 1;\`,
        message: [
          \`Create the variable <span class='var'>i</span> and set it to <span class='val'>\${i}</span>\`,
          \`Create the variable <span class='var'>j</span> and set it to <span class='val'>\${j}</span>\`
        ],
        
        
      });
    `);
  });
});

describe('ExpressionStatement', () => {


  it('increment: i++; UpdateExpression', function () {
    expectCodeToSpies(`i++;`, `
      i++;
      ;spy({
        evaluateVar: {
          i: i,
        },
        nodeCode: \`i++;\`,
        message: [
          \`increment <span class='readable-variable'>i</span> by <span class='readable-value'>1</span>\`
        ],
      });
    `);
  });

  it('i+=1 AssignmentExpression', function () {
    expectCodeToSpies(`i+=1;`, `
      i+=1;
      ;spy({
        evaluateVar: {
          i: i,
        },
        nodeCode: "i+=1;",
        message: [
          \`add add <span class='val'>1</span> to <span class='var'>i</span> and set <span class='var'>i</span> to <span class='val'>\${i}</span>\`
        ],
      });
    `);
  });

  it('i = i + 1 AssignmentExpression', function () {
    expectCodeToSpies(`i+=1;`, `
      i+=1;
      ;spy({
        
        evaluateVar: {
          i: i,
        },
        nodeCode: "i = i + 1;",
        message: [
          \`add add <span class='val'>1</span> to <span class='var'>i</span> and set <span class='var'>i</span> to <span class='val'>\${i}</span>\`
        ],
        
        
      });
    `);
  });

  it('i Identifier', function () {
    expectCodeToSpies(`i;`, `
      i;
      ;spy({
        nodeCode: "i;",
        message: [
          \`\`
        ],
      });
    `);
  });

  it('1+1; ExpressionStatement', function () {
    expectCodeToSpies(`1+1;`, `
      1+1;
      ;spy({
        nodeCode: "1+1;",
        message: [
          \`\`
        ],
      });
    `);
  });

});


describe('condition', () => {

  it('if', function () {
    expectCodeToSpies(`
if (true) {
}  
`,
      // language=js
      `
        if (true) {
          ;spy({
            ifConditionTest: true,
            
            nodeCode: \`if (true) {
}\`,
            message: [
              \`Because\`
            ],
          });

        } else {

          ;spy({
            ifConditionTest: false,
            
            nodeCode: \`if (true) {
}\`,
            message: [
              \`Skip because\`
            ],
          });
        }
      `);
  });


  it('if...else', function () {
    expectCodeToSpies(`
if (true) {
} else {
}
`,
      // language=js
      `
        if (true) {
          ;spy({
            ifConditionTest: true,
            
            nodeCode: \`if (true) {
} else {
}\`,
            message: [
              \`Because\`
            ],
          });

        } else {
          ;spy({
            ifConditionTest: false,
            
            nodeCode: \`if (true) {
} else {
}\`,
            message: [
              \`Skip because\`
            ],
          });
        }

      `
    );
  });


  it('if nested', function () {
    expectCodeToSpies(`
        if (true) {
          if (true) {
          }
        }
        `,
      // language=js

      `
        if (true) {
          spy({
            ifConditionTest: true,

            nodeCode: \`if (true) {
          if (true) {
          }
        }\`,
            message: [\`Because\`],
          });

          if (true) {
            spy({
              ifConditionTest: true,

              nodeCode: \`if (true) {
          }\`,
              message: [\`Because\`],
            });
          } else {
            spy({
              ifConditionTest: false,

              nodeCode: \`if (true) {
          }\`,
              message: [\`Skip because\`],
            });
          }
        } else {
          spy({
            ifConditionTest: false,

            nodeCode: \`if (true) {
          if (true) {
          }
        }\`,
            message: [\`Skip because\`],
          });
        }
      `
    );
  });


});

describe('function', () => {
  it('function declaration and call', function () {
    expectCodeToSpies(
      // language=js

      `
      e();
      
      function e () {
      }
    `,
      // language=js
      `
      spy({
        evaluateVar: {
          e: e,
        },
        nodeCode:\`e();\`,
        message: [\`Call function e\`],
      });
      e();
      
      function e() {}
    `);
  });

  it('function body is being spied', function () {
    expectCodeToSpies(`
      function e () {
        var i = 0;
      }
    `,
      // language=js
      `
      function e() {
        var i = 0;
        spy({
          evaluateVar: {
            i: i,
          },
          nodeCode: \`var i = 0;\`,
          message: [
            \`Create the variable <span class='var'>i</span> and set it to <span class='val'>\${i}</span>\`,
          ],
        });
      }
    `);
  });


});
