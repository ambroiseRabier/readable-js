import {prepareEvalCode, runCodeWith} from './run-the-code';

describe('prepareEvalCode', () => {
  it('correct return', function () {
    expect(
      prepareEvalCode(`var i = 5;`, ['a', 'b'])
    ).toEqual(
      `"use strict";
return (function(a, b) {
var i = 5;
});`
    );
  });
});

describe('runCodeWith', () => {
  it('run the code', function () {
    expect(
      () => runCodeWith(`var a = 1 + 1`)
    ).not.toThrow();
  });

  it('run the code with params', function () {
    let b = {value: 0};
    runCodeWith(`b.value = 1 + 2`, new Map([
      ['b', b]
    ]));
    expect(b.value).toEqual(3);
  });

  it('error are not catched', function () {
    expect(
      () => runCodeWith(`b.value !e= /1 + 2`)
    ).toThrowError(
      "Unexpected token '!'"
    );
  });
});
