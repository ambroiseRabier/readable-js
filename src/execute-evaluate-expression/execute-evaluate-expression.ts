
export function executeEvaluateExpression(previousCode: string, expression: string) {
  return Function(`${previousCode}; return ${expression};`)();
}

