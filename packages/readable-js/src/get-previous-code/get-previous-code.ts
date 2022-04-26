import {Program} from 'esprima';

export function getPreviousCode(code: string, esprimaBodyIndex: number, esprima: Program): string {
  // return full code if index >=
  if (esprimaBodyIndex >= esprima.body.length) {
    return code;
  }

  const range = esprima.body[esprimaBodyIndex].range!; // why would it be undefined ??
  return code.substring(0, range[0]);
}

export function getPreviousCodeIncluded(code: string, esprimaBodyIndex: number, esprima: Program): string {
  // not tested !
  // return full code if index >=
  if (esprimaBodyIndex >= esprima.body.length) {
    return code;
  }

  const range = esprima.body[esprimaBodyIndex].range!; // why would it be undefined ??
  return code.substring(0, range[1]);
}
