import {insertSpies, Options} from './insert-spies';
import * as prettier from 'prettier';


const helpfulTestOptions: Options = {
  range: false,
  loc: false,
  classNames: {
    value: 'val',
    variable: 'var',
    expression: 'exp',
  },
};

// use default formatter (prettier insist)
const pFormat = (code: string) => prettier.format(code, {parser: 'babel'});

// prettier is not perfect for that purpose, it does preserve some spacing
const expectCodeToSpies = (code: string, beEqualTo: string, onlySpies?: boolean) => {
  const codeAsStr: string = insertSpies(code, onlySpies ?
    {...helpfulTestOptions, spyParamHook: e => ''}
    : helpfulTestOptions
  );

  let formatGenerated;
  let formatExpected;

  try {
    formatGenerated = pFormat(codeAsStr);
  } catch (e) {
    console.warn("format didn't work, invalid code in generated code.");

    // much easier to look at with webstorm compare than an error !
    expect(
      codeAsStr
    ).toEqual(
      beEqualTo
    );
  }

  try {
    formatExpected = pFormat(beEqualTo);
  } catch (e) {
    throw new Error('Incorrect code in expected code.');
  }

  expect(
    formatGenerated
  ).toEqual(
    formatExpected
  );
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
  messages: [
    [1, 1, \`Create the variable <span class="readable-variable">i</span> and set it to <span class="readable-value">\${i}</span>\`]
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
  messages: [
    [1, 1, \`Create the variable <span class="readable-variable">i</span> and set it to <span class="readable-value">\${i}</span>\`]
  ],
  range: [0, 10],
});
`;
    expect(r).toEqual(e);
  });

  it('can remove range', function () {
    const r = insertSpies(`var i = 0;`, {range: false});
    expect(r).not.toContain('range');
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
    // on a different line
    expectCodeToSpies(`var i = 0, 
    j = 1;`,
      // language=js
      `
        var i = 0,
          j = 1;
        spy({
          evaluateVar: {
            i: i,
            j: j,
          },
          nodeCode: \`var i = 0, 
    j = 1;\`,
          messages: [
            [
              1,
              1,
              \`Create the variable <span class="var">i</span> and set it to <span class="val">\${i}</span>\`,
            ],
            [
              2,
              2,
              \`Create the variable <span class="var">j</span> and set it to <span class="val">\${j}</span>\`,
            ],
          ],
        });
    `);
  });
});

describe('ExpressionStatement', () => {


  it('increment: i++; UpdateExpression', function () {
    expectCodeToSpies(`i++;`, `
      i++;
      spy({
        evaluateVar: {
          i: i,
        },
        nodeCode: \`i++;\`,
        messages: [
          [
            1,
            1,
            \`Increment <span class="var">i</span> by <span class="val">1</span>\`,
          ],
        ],
      });
    `);
  });

  it('i+=1 AssignmentExpression', function () {
    expectCodeToSpies(`i+=1;`, `i += 1;
      spy({
        evaluateVar: {
          i: i,
        },
        nodeCode: \`i+=1;\`,
          messages: [
            [
              1,
              1,
              \`Add <span class="exp">1</span> to <span class="var">i</span> and set <span class="var">i</span> to <span class="val">\${i}</span>\`,
            ]
          ]
      });
    `);
  });

  it('i = i + 1 AssignmentExpression', function () {
    expectCodeToSpies(`i = i + 1`, `
      i = i + 1;
      spy({
        evaluateVar: {
          i: i,
        },
        nodeCode: \`i = i + 1\`,
        messages: [
          [1, 1, \`Set <span class="var">i</span> to <span class="val">\${i}</span>\`]
        ]
      });
    `);
  });

  it('i Identifier', function () {
    expectCodeToSpies(`i;`, `i;
      spy({
        nodeCode: \`i;\`,
        messages: [[1, 1, \`\`]],
      });
    `);
  });

  it('1+1; ExpressionStatement', function () {
    expectCodeToSpies(`1+1;`, `1 + 1;
      spy({
        nodeCode: \`1+1;\`,
        messages: [[1, 1, \`\`]],
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
          spy({
            ifConditionTest: true,
            nodeCode: \`if (true) {
}\`,
            messages: [[2, 2, \`Because ... evaluate to true\`]],
          });
        } else {
          spy({
            ifConditionTest: false,
            nodeCode: \`if (true) {
}\`,
            messages: [[2, 2, \`Skip because ... evaluate to false\`]],
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
          spy({
            ifConditionTest: true,
            nodeCode: \`if (true) {
} else {
}\`,
            messages: [[2, 2, \`Because ... evaluate to true\`]],
          });
        } else {
          spy({
            ifConditionTest: false,
            nodeCode: \`if (true) {
} else {
}\`,
            messages: [[2, 2, \`Skip because ... evaluate to false\`]],
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
            messages: [[2, 2, \`Because ... evaluate to true\`]],
          });
          
          if (true) {
            spy({
              ifConditionTest: true,
              nodeCode: \`if (true) {
          }\`,
              messages: [[3, 3, \`Because ... evaluate to true\`]],
            });
          } else {
            spy({
              ifConditionTest: false,
              nodeCode: \`if (true) {
          }\`,
              messages: [[3, 3, \`Skip because ... evaluate to false\`]],
            });
          }
        } else {
          spy({
            ifConditionTest: false,
            nodeCode: \`if (true) {
          if (true) {
          }
        }\`,
            messages: [[2, 2, \`Skip because ... evaluate to false\`]],
          });
        }
      `
    );
  });

  it('multiples instructions in if', function () {
    expectCodeToSpies(`
if (false) {
  j += 1;
  i--;
}`,
 // language=js
      `if (false) {
        spy({
          ifConditionTest: true,
          nodeCode: \`if (false) {
  j += 1;
  i--;
}\`,
          messages: [[2, 2, \`Because ... evaluate to true\`]],
        });

        j += 1;
        spy({
          evaluateVar: {
            j: j,
          },
          nodeCode: \`j += 1;\`,
          messages: [
            [
              3,
              3,
              \`Add <span class="exp">1</span> to <span class="var">j</span> and set <span class="var">j</span> to <span class="val">\${j}</span>\`,
            ],
          ],
        });

        i--;
        spy({
          evaluateVar: {
            i: i,
          },
          nodeCode: \`i--;\`,
          messages: [
            [
              4,
              4,
              \`Increment <span class="var">i</span> by <span class="val">1</span>\`,
            ],
          ],
        });
      } else {
        spy({
          ifConditionTest: false,
          nodeCode: \`if (false) {
  j += 1;
  i--;
}\`,
          messages: [[2, 2, \`Skip because ... evaluate to false\`]],
        });
      }
      `)
  });

  it('else with instructions ', function () {
    expectCodeToSpies(`
    var j = 0;
    
    if (j == 0) {
      j += 1;
    } else {
      j++;
    }
    `,
      // language=js
      `var j = 0;
      spy({
        evaluateVar: {
          j: j,
        },
        nodeCode: \`var j = 0;\`,
        messages: [
          [
            2,
            2,
            \`Create the variable <span class="var">j</span> and set it to <span class="val">\${j}</span>\`,
          ],
        ],
      });

      if (j == 0) {
        spy({
          ifConditionTest: true,
          nodeCode: \`if (j == 0) {
      j += 1;
    } else {
      j++;
    }\`,
          messages: [[4, 4, \`Because ... evaluate to true\`]],
        });

        j += 1;
        spy({
          evaluateVar: {
            j: j,
          },
          nodeCode: \`j += 1;\`,
          messages: [
            [
              5,
              5,
              \`Add <span class="exp">1</span> to <span class="var">j</span> and set <span class="var">j</span> to <span class="val">\${j}</span>\`,
            ],
          ],
        });
      } else {
        spy({
          ifConditionTest: false,
          nodeCode: \`if (j == 0) {
      j += 1;
    } else {
      j++;
    }\`,
          messages: [[4, 4, \`Skip because ... evaluate to false\`]],
        });

        j++;
        spy({
          evaluateVar: {
            j: j,
          },
          nodeCode: \`j++;\`,
          messages: [
            [
              7,
              7,
              \`Increment <span class="var">j</span> by <span class="val">1</span>\`,
            ],
          ],
        });
      }
      `)
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
        messages: [[2, 2, \`Call function e\`]],
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
        spy();
      }
    `, true);
  });

});

describe('loops', () => {

  it('while', function () {
    expectCodeToSpies(`
      var i = 0;
      while (i < 2) {
        i += 1;
      }
    `,
      // language=js
      `var i = 0;
      spy({
        evaluateVar: {
          i: i,
        },
        nodeCode: \`var i = 0;\`,
        messages: [
          [
            2,
            2,
            \`Create the variable <span class="var">i</span> and set it to <span class="val">\${i}</span>\`,
          ],
        ],
      });

      while (i < 2) {
        spy({
          ifConditionTest: true,
          nodeCode: \`while (i < 2) {
        i += 1;
      }\`,
          messages: [
            [3, 3, \`Because ...\`],
            [5, 5, \`... and try again\`],
          ],
        });

        i += 1;
        spy({
          evaluateVar: {
            i: i,
          },
          nodeCode: \`i += 1;\`,
          messages: [
            [
              4,
              4,
              \`Add <span class="exp">1</span> to <span class="var">i</span> and set <span class="var">i</span> to <span class="val">\${i}</span>\`,
            ],
          ],
        });
      }
      spy({
        ifConditionTest: false,
        nodeCode: \`while (i < 2) {
        i += 1;
      }\`,
        messages: [
          [3, 3, \`Because ... is not\`],
          [5, 5, \`... stop looping\`],
        ],
      });
      `);
  });

  it('for', function () {
    expectCodeToSpies(
      `for (let i = 0; i < 2; i++) {
        1+1;
      }`,
      // language=js
      `for (let i = 0; i < 2; i++) {
        spy({
          ifConditionTest: true,
          nodeCode: \`for (let i = 0; i < 2; i++) {
        1+1;
      }\`,
          messages: [
            [1, 1, \`Because ...\`],
            [3, 3, \`... and try again\`],
          ],
        });

        1 + 1;
        spy({
          nodeCode: \`1+1;\`,
          messages: [[2, 2, \`\`]],
        });

        spy({
          evaluateVar: {
            i: i,
          },
          nodeCode: \`i++\`,
          messages: [
            [
              1,
              1,
              \`Increment <span class="var">i</span> by <span class="val">1</span>\`,
            ],
          ],
        });
      }
      spy({
        ifConditionTest: false,
        nodeCode: \`for (let i = 0; i < 2; i++) {
        1+1;
      }\`,
        messages: [
          [1, 1, \`Because ... is not\`],
          [3, 3, \`... stop looping\`],
        ],
      });
      `);
  });
});
