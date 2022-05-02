
// may need to change 'spy' name to avoid collision
import {DefaultSpyParams, insertSpies, Options} from './insert-spies/insert-spies';
import {runCodeWith} from './run-code-with/run-the-code';

export const SPY_FC_NAME = 'spy';

export function runCodeWithSpy(code: string, options?: Options): DefaultSpyParams[] {
  const calls: DefaultSpyParams[] = [];

  // I could put multiple parameters, but best is to use an object for extra clarity with keys.
  const spyFc = (firstArg) => {
    calls.push(firstArg);
  };

  const codeWithSpies = insertSpies(code, options);

  runCodeWith(codeWithSpies, new Map([
    [SPY_FC_NAME, spyFc]
  ]));

  return calls;
}
