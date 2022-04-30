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
      "i--;",
    ]);
  });
});

describe('variables', () => {
  it('var declaration without value', function () {
    expect(
      runCodeWithSpy(`var i;`).map(e => e.messages[2])
    ).toEqual(
      [`Create the variable <span class='var'>i</span>`]
    );
  });

  it('muliples var declaration with value', function () {
    expect(
      runCodeWithSpy(`var i = 0, j = 1;`).map(e => e.messages[2])
    ).toEqual([
      `Create the variable <span class='var'>i</span> and set it to <span class='val'>0</span>`,
      `Create the variable <span class='var'>j</span> and set it to <span class='val'>1</span>`
    ]);
  });
});
