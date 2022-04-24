import {insertSpies} from './insert-spies';


it('should insert spy with correct params', function () {
  const r = insertSpies(`var i = 0;`, 'spy');
  const e =
`var i = 0;
;spy({
  
  evaluateVar: {i: i},
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
`

  expect(r).toEqual(e);
});

it('should insert custom spy', function () {
  const r = insertSpies(`var j = 1;`, 'spy', e => e.range![1] + '');
  const e =
`var j = 1;
;spy(10);
`

  expect(r).toEqual(e);
});

it('insert multiple spy', function () {
  const r = insertSpies(`var i = 0; var j = 0;`, 'spy', node => '');

  const e =
`var i = 0;
;spy();
 var j = 0;
;spy();
`

  expect(r).toEqual(e);
})


describe('variable', () => {
  it('multiple declarations', function () {
    const r = insertSpies(`var i = 0, j = 1;`, 'spy');
    const e =
      `var i = 0, j = 1;
;spy({
  
  evaluateVar: {
i: i,
j: j,
},
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
`

    expect(r).toEqual(e);
  });
});


describe('condition', () => {


  it('should insert spy with correct params for condition', function () {
    const r = insertSpies(`if (true) { 1+1 }`, 'spy');
    const e =
`if (true) {
;spy({
  ifConditionTest: true,
  
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
 1+1 } else {

;spy({
  ifConditionTest: false,
  
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

}`

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
let i = 0;
;spy();

if (true) {
;spy();

  i++;
} else {

;spy();

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
let i = 0;
;spy();

if (true) {
;spy();

  if (true) {
;spy();

    i++;
  } else {

;spy();

}
} else {

;spy();

}
`

    expect(r).toEqual(e);
  });


});
