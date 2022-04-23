import * as esprima from 'esprima';

export function insertSpies(code: string, spyFcName: string): string {
  const r = esprima.parseScript(code, {
    "range": true, // range will serve as id
    "loc": true,
  });

  let newCode = code;

  for (let i = r.body.length-1; i >= 0; i--) {
    const e = r.body[i];

    if (!e.range || !e.loc) {
      console.log(r.body);
      throw new Error(`Unexpected case, when is range undefined ?? \n body index: ${i} \n code: ${code}`);
    }

    const [start, end] = e.range;

    const spyString = `

${spyFcName}({
  range: [${start}, ${end}],
  loc: {
    "start": {
      "line": ${e.loc.start.line},
      "column": ${e.loc.start.column}
    },
    "end": {
      "line": ${e.loc.end.line},
      "column": ${e.loc.end.column}
    }
  }
})
`;
    // insert spy string in between (this won't work as easy when adding scope, if, loop, function, etc
    newCode = newCode.substring(0, start) + spyString + newCode.substring(start, newCode.length);
  }

  return newCode;
}
