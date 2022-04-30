import {generateCallStack} from './generate-call-stack';


it('generateCallStack error handled', function () {
  const r = generateCallStack(`
    var i = 0;
    var !j = 1;
  `);

  expect(r.error).toEqual({
    "description": "Unexpected token !",
    "index": 24,
    "lineNumber": 3
  });
});

it('generateCallStack run normaly', function () {
  const r = generateCallStack(`
    var i = 0;
  `);

  expect(r).toEqual({
    "calls": [
      {
        "evaluateVar": {
          "i": 0
        },
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
        "messages": [
          [
            2,
            2,
            "Create the variable <span class=\"readable-variable\">i</span> and set it to <span class=\"readable-value\">0</span>"
          ]
        ],
        "nodeCode": "var i = 0;",
        "range": [
          5,
          15
        ]
      }
    ]
  });
});
