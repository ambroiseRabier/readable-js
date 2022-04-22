import * as esprima from 'esprima';
import {ReadableJS} from '../index';
import {getPreviousCode, getPreviousCodeIncluded} from './get-previous-code';

it('getPreviousCode', function () {
  const code = `var c = 1; c = c + 1;`;
  const r = esprima.parseScript(code, {
    "range": true,
    "loc": true
  });

  expect(
    getPreviousCode(code, 0, r)
  ).toEqual(
    ''
  );

  expect(
    getPreviousCode(code, 1, r)
  ).toEqual(
    'var c = 1; '
  );

  expect(
    getPreviousCode(code, 2, r)
  ).toEqual(
    'var c = 1; c = c + 1;'
  );
});

it('getPreviousCode if', function () {
  const code = `if (1 + 2) { console.log('hi'); }`;
  const r = esprima.parseScript(code, {
    "range": true,
    "loc": true
  });

  // multiple variable declaration will count as one
  expect(
    getPreviousCode(code, 0, r)
  ).toEqual(
    ``
  );
});

it('getPreviousCode multiline', function () {
  const code = `var bar = 2, foo = 3;
bar = 1 + bar`;
  const r = esprima.parseScript(code, {
    "range": true,
    "loc": true
  });

  // multiple variable declaration will count as one
  expect(
    getPreviousCode(code, 1, r)
  ).toEqual(
    `var bar = 2, foo = 3;
`
  );
});

it('getPreviousCodeIncluded', function () {
  const code = `var bar = 2;
bar = 1 + bar`;
  const r = esprima.parseScript(code, {
    "range": true,
    "loc": true
  });

  expect(
    getPreviousCodeIncluded(code, 1, r)
  ).toEqual(
    `var bar = 2;
bar = 1 + bar`
  );
});
