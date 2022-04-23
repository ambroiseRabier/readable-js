import {callsToCode, runCodeWithSpy} from './generate-call-stack';

it('give calls', function () {
  const r = runCodeWithSpy(`
    var i = 0;
    i++;
  `);

  expect(r).toEqual({
    "calls": [
      {
        "loc": {
          "end": {
            "column": 14,
            "line": 2
          },
          "start": {
            "column": 4,
            "line": 2
          }
        },
        "range": [
          5,
          15
        ]
      },
      {
        "loc": {
          "end": {
            "column": 8,
            "line": 3
          },
          "start": {
            "column": 4,
            "line": 3
          }
        },
        "range": [
          20,
          24
        ]
      }
    ]
  });
});

/**
 * try {
 *    Function('con!sole.log(a)')()
 * } catch (e) {console.log(e); }
 *
 * work. but mine doesn't work ? An issue with jest only maybe ?
 */
// it('give errors', function () {
//   const r = runCodeWithSpy(`
//     var !i = 0
//     i++;
//   `);
//
//   expect(r).toEqual({
//     "calls": 2  });
// })


it('callsToCode', function () {
  const code = `
    var i = 0;
    i++;
  `;
  const r = runCodeWithSpy(code);

  expect(callsToCode(code, r.calls)).toEqual([
    "var i = 0;",
    "i++;"
  ]);
});


function assertCode(code, expectation) {
  const r = runCodeWithSpy(code);

  expect(
    callsToCode(code, r.calls)
  ).toEqual(
    expectation
  );
}

describe('if', () => {
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
});


