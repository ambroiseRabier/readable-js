import {insertSpies} from './insert-spies';

it('should insert spy', function () {
  const r = insertSpies(`var i = 0;`, 'spy');
  const e =
`

spy({
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
})
var i = 0;`

  expect(r).toEqual(e);
});

it('should insert multiples spy', function () {
  const r = insertSpies(`var i = 0; var j = 1;`, 'spy');
  const e =
`


spy({
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
})
var i = 0; 

spy({
  range: [11, 21],
  loc: {
    "start": {
      "line": 1,
      "column": 11
    },
    "end": {
      "line": 1,
      "column": 21
    }
  }
})
var j = 1;`

  expect(r).toEqual(e);
});
