import {generateReadable} from './generate-readable';

it('return string prepared to become template string', function () {
  const eNode = {
    "type": "VariableDeclaration",
    "declarations": [
      {
        "type": "VariableDeclarator",
        "id": {
          "type": "Identifier",
          "name": "i",
          "range": [
            4,
            5
          ],
          "loc": {
            "start": {
              "line": 1,
              "column": 4
            },
            "end": {
              "line": 1,
              "column": 5
            }
          }
        },
        "init": {
          "type": "Literal",
          "value": 0,
          "raw": "0",
          "range": [
            8,
            9
          ],
          "loc": {
            "start": {
              "line": 1,
              "column": 8
            },
            "end": {
              "line": 1,
              "column": 9
            }
          }
        },
        "range": [
          4,
          9
        ],
        "loc": {
          "start": {
            "line": 1,
            "column": 4
          },
          "end": {
            "line": 1,
            "column": 9
          }
        }
      }
    ],
    "kind": "var",
    "range": [
      0,
      10
    ],
    "loc": {
      "start": {
        "line": 1,
        "column": 0
      },
      "end": {
        "line": 1,
        "column": 10
      }
    }
  };

  expect(
    generateReadable(eNode as any, ["i"])
  ).toEqual(
    [
      "Create the variable <span class='readable-variable'>i</span> and set it to <span class='readable-value'>${i}</span>"
    ]
  );
});
