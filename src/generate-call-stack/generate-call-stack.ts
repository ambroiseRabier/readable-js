/**
 * EXECUTE THE CODE.
 */
import {runCodeWith} from './run-code-with/run-the-code';

export function generateCallStack(code: string) {


}



function runCodeWithSpy(code, spy) {
  const spyFc = () => {

  };

  const error = runCodeWith(code, new Map([
    ['spy', spyFc]
  ]));

  return {

    error,
  }
}
