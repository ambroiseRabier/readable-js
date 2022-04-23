import {
  SourceLocation
} from 'estree';

/**
 * EXECUTE THE CODE.
 */
import {runCodeWith} from './run-code-with/run-the-code';
import {insertSpies} from './insert-spies/insert-spies';

/**
 * Run the code, return the callstack with information from esprima about
 * position of the code.
 * @param code
 */
export function generateCallStack(code: string) {
  return runCodeWithSpy(code);
}


interface SpyParams {
  range: [number, number];
  loc: SourceLocation;
}

export function callsToCode(code: string, calls: SpyParams[]): string[] {
  return calls.map(e => code.substring(...e.range));
}


export function runCodeWithSpy(code: string) {
  const calls: SpyParams[] = [];

  // may need to change 'spy' name to avoid collision
  const SPY_FC_NAME = 'spy';

  // I could put multiple parameters, but best is to use an object for extra clarity with keys.
  const spyFc = (firstArg) => {
    calls.push(firstArg);
  };

  const codeWithSpies = insertSpies(code, SPY_FC_NAME);

  let error: any;

  // doesn't seem to work, or is it just Jest ?
  try {
    runCodeWith(codeWithSpies, new Map([
      [SPY_FC_NAME, spyFc]
    ]));
  } catch (e) {
    error = e;
  }

  return {
    calls,
    error,
  }
}
