
/**
 * Prepare the code following https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval
 * recommendation.
 */
export function prepareEvalCode(code: string, argsStr: string[]): string {
  // Note: You cannot catch syntax error by putting the code inside an -also evaluated- try...catch
  const preparedFc = `function(${argsStr.join(', ')}) {\n${code}\n}`;

  return `"use strict";\nreturn (${preparedFc});`;
}

/**
 * Prepare the code following https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval
 * recommendation.
 *
 * And execute it.
 *
 * NOTE: I have no idea in which context the code will get run. It has access to global object like window though.
 *       But probably doesn't have access to the scope in which `runCodeWith` is called. I tried one or two thing
 *       with binding `this`, without success.
 */
export function runCodeWith(code: string, args?: Map<string, any>, context?: any) {
  if (!args) {
    args = new Map();
  }

  const argsStr = Array.from(args.keys());
  const argObj = Array.from(args.values());
  const evalCode = prepareEvalCode(code, argsStr);

  const fc = Function(evalCode)()(
    ...argObj
  );

  return {returned: fc};
}
