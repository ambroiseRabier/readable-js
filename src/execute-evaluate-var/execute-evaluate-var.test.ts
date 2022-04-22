import {executeEvaluateVar} from './execute-evaluate-var';

it('evaluate var', function () {
  expect(
    executeEvaluateVar('var bar = 2; let foo = 3;', ['bar', 'foo'])
  ).toEqual(new Map([
    ['bar', 2],
    ['foo', 3],
  ]));
});
