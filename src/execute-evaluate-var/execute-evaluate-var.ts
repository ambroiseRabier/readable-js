/**
 * Execute `previousCode` and evaluate all variables in `variableIdentifier`.
 */
export function executeEvaluateVar(previousCode: string, variableIdentifier: string[]): Map<string, any> {
  const values = Function(`${previousCode}; return [${variableIdentifier.join(',')}]`)();
  const map = new Map();

  for (let i = 0; i < variableIdentifier.length; i++) {
    map.set(variableIdentifier[i], values[i]);
  }

  return map;
}
