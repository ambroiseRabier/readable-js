import {insertSpies} from './insert-spies';

// describe('insertSpyCodeBefore', () => {
//   it('return correct', function () {
//
//   });
// });

it('should insert spy with correct params', function () {
  const r = insertSpies(`var i = 0;`, 'spy');
  const e =
`
;spy({
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
});
var i = 0;`

  expect(r).toEqual(e);
});

it('should insert custom spy', function () {
  const r = insertSpies(`var j = 1;`, 'spy', e => e.range![1] + '');
  const e =
`
;spy(10);
var j = 1;`

  expect(r).toEqual(e);
});

it('insert multiple spy', function () {
  const r = insertSpies(`var i = 0; var j = 0;`, 'spy', node => '');

  const e =
`
;spy();
var i = 0; 
;spy();
var j = 0;`

  expect(r).toEqual(e);
})


describe('condition', () => {


  it('should insert spy with correct params for condition', function () {
    const r = insertSpies(`if (true) { 1+1 }`, 'spy');
    const e =
`
;spy({
  range: [0, 17],
  loc: {
    "start": {
      "line": 1,
      "column": 0
    },
    "end": {
      "line": 1,
      "column": 17
    }
  }
});
if (true) { 
;spy({
  range: [12, 16],
  loc: {
    "start": {
      "line": 1,
      "column": 12
    },
    "end": {
      "line": 1,
      "column": 16
    }
  }
});
1+1 }`

    expect(r).toEqual(e);
  });


  it('if', function () {
    const r = insertSpies(`
let i = 0;
if (true) {
  i++;
}  
`, 'spy', node => '');

    const e =
      `

;spy();
let i = 0;

;spy();
if (true) {
  
;spy();
i++;
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
`, 'spy', node => '');

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
`, 'spy', node => '');

    const e =
      `

;spy();
let i = 0;

;spy();
if (true) {
  
;spy();
if (true) {
    
;spy();
i++;
  }
}
`

    expect(r).toEqual(e);
  });


});
