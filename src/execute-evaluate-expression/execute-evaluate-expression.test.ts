import {executeEvaluateExpression} from './execute-evaluate-expression';

it('evaluate expression', function () {
  expect(
    executeEvaluateExpression('', '1 + 1')
  ).toEqual(
    2
  );
  expect(
    executeEvaluateExpression('var bar = 2;', 'bar + 1')
  ).toEqual(
    3
  );
});
