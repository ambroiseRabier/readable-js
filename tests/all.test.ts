import {ReadableJS} from '../src/index';

it('should return nothing for nothing', function () {
  expect(
    ReadableJS.read('')
  ).toEqual('');

});
