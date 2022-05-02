/**
 * EXECUTE THE CODE.
 */
import {DefaultSpyParams, Options} from './run-code-with-spy/insert-spies/insert-spies';
import {runCodeWithSpy} from './run-code-with-spy/run-code-with-spy';

/**
 * Run the code, return the callstack with information from esprima about
 * position of the code.
 * @param code
 * @param options
 */
export function generateCallStack(code: string, options?: Options): { calls: DefaultSpyParams[]; error: any } {
  let calls: ReturnType<typeof runCodeWithSpy> = [];
  let error: any;

  try {
    calls = runCodeWithSpy(code, options);
  } catch (e) {
    error = e;
  }

  return {
    error: error,
    calls: calls,
  };
}

