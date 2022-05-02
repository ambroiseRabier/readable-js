import {runCodeWithSpy} from './run-code-with-spy';

it('give calls', function () {
  const r = runCodeWithSpy(`
    var i = 0;
    var j = 1;
  `);

  expect(r).toHaveLength(2);
});

function assertCode(code, expectation) {
  const calls = runCodeWithSpy(code);

  expect(
    calls.map(e => code.substring(...e.range))
  ).toEqual(
    expectation
  );
}

describe('read the code as executed', () => {
  it('true condition', function () {
    assertCode(`
    var i = 0;
    if (true) { i--; }
  `, [
      "var i = 0;",
      "if (true) { i--; }",
      "i--;",
    ]);
  });

  it('false condition', function () {
    assertCode(`
    var i = 0;
    if (false) { i--; }
  `, [
      "var i = 0;",
      "if (false) { i--; }",
    ]);
  });

  it('while loop', function () {
    assertCode(`
    var i = 2;
    while (i > 0) { i--; }
  `, [
      "var i = 2;",
      "while (i > 0) { i--; }",
      "i--;",
      "while (i > 0) { i--; }",
      "i--;",
      "while (i > 0) { i--; }"
    ]);
  });
});

/**
 * Note on double array: You can have multiples messages for one spy (like while loop)
 */
function assertMessages(code: string, ...expectation: string[][]) {
  expect(
    runCodeWithSpy(code, {
      classNames: {
        value: 'val',
        variable: 'var',
        expression: 'exp',
      }
    }).map(e => e.messages.map(b => b[2]))
  ).toEqual(
    expectation
  );
}

describe('variables', () => {
  it('var/let declaration without value', function () {
    assertMessages(
      `var i;`,
      [`Create the variable <span class="var">i</span>`]
    );
    assertMessages(
      `let i;`,
      [`Create the variable <span class="var">i</span>`]
    );
  });

  it('multiples var declaration with value', function () {
    assertMessages(
      `var i = 0, j = 1;`,
      [
        `Create the variable <span class="var">i</span> and set it to <span class="val">0</span>`,
        `Create the variable <span class="var">j</span> and set it to <span class="val">1</span>`
      ],
    );
  });

  it('const declaration', function () {
    assertMessages(
      "const p = 21",
      [`Create the constant <span class="var">p</span> and set it to <span class="val">21</span>`]
    );
  });

  it('function as value', function () {
    assertMessages(
      "var fn = function() { return true; }",
      [`Create the variable <span class="var">fn</span> and set it to <span class="val">an anonymous function</span>`]
    );
  });
});

it('Assignment', () => {
  assertMessages(
    "let foo; foo = 1 + 1",
    [`Create the variable <span class="var">foo</span>`],
    [`Set <span class="var">foo</span> to <span class="val">2</span>`]
  );
});
