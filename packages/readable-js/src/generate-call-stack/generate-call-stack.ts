/**
 * EXECUTE THE CODE.
 */
import {DefaultSpyParams} from './run-code-with-spy/insert-spies/insert-spies';
import {runCodeWithSpy} from './run-code-with-spy/run-code-with-spy';

/**
 * Run the code, return the callstack with information from esprima about
 * position of the code.
 * @param code
 */
export function generateCallStack(code: string): { calls: DefaultSpyParams[]; error: any } {
  let calls: ReturnType<typeof runCodeWithSpy> = [];
  let error: any;

  try {
    calls = runCodeWithSpy(code);
  } catch (e) {
    error = e;
  }

  return {
    error: error,
    calls: calls,
  };
}

