import * as esprima from 'esprima';
import {Program} from 'esprima';
import {ExpressionStatement, IfStatement, SourceLocation} from 'estree';
import {is} from '../../enode-type-check';

// esprima.body[0] for example
type EsprimaNode = Pick<Program, "body">['body'][number];

interface HasRangeLOC {
  range: [number, number];
  loc: SourceLocation;
}

type EsprimaNodeWithRangeLOC = EsprimaNode & HasRangeLOC;


function insertSpyCodeBefore(
  newCode: string,
  eNode: EsprimaNodeWithRangeLOC,
  offset: number,
  spyFcName: string,
  spyParamHook?: (e: EsprimaNode) => string
): { insertedCodeLength: number; newCode: string; } {
  const [start, end] = eNode.range;

  const spyFirstParam = spyParamHook ? spyParamHook(eNode) : `{
  range: [${start}, ${end}],
  loc: {
    "start": {
      "line": ${eNode.loc.start.line},
      "column": ${eNode.loc.start.column}
    },
    "end": {
      "line": ${eNode.loc.end.line},
      "column": ${eNode.loc.end.column}
    }
  }
}`;

  // Give extra line return to make is readable
  // Give extra semi-colon, in case there is an expression without semi-colon before.
  const spyString = `
;${spyFcName}(${spyFirstParam});
`;

  // insert spy string in between (this won't work as easy when adding scope, if, loop, function, etc
  return {
    insertedCodeLength: spyString.length,
    newCode: newCode.substring(0, start+ offset) + spyString + newCode.substring(start+ offset, newCode.length),
  };
}

function isHasRangeLOC(a: any): a is HasRangeLOC {
  return !!a.range && !!a.loc;
}

function getChildStatements (eNode: EsprimaNode): EsprimaNode[] {

  type AllNodeType = typeof eNode['type'];

  const m = new Map<AllNodeType, (next: any) => EsprimaNode[]>([

    ["IfStatement", (next: IfStatement) => {
      let ret: EsprimaNode[] = [];

      /*
       * if (true) i++;
       */
      if (is.ExpressionStatement(next.consequent)) {
        // skip for now, putting a spy with semi-colon in the middle will change the if !
        // next.consequent.expression
      }

      /*
      * if (true) {
      *   i++;
      * }
      * */
      if (is.BlockStatement(next.consequent)) {
        ret = [...ret, ...next.consequent.body];
      }

      /*
       * else statement with {}
       * */
      if (!!next.alternate && is.BlockStatement(next.alternate)) {
        ret = [...ret, ...next.alternate.body];
      }

      return ret;
    }],

    ["ExpressionStatement", (next: ExpressionStatement) => {
      return [];
    }],
  ]);

  const getChildFc = m.get(eNode.type);

  if (!getChildFc) {
    console.warn(`${eNode.type} in ${getChildStatements.name} not processed.`)
  }

  return getChildFc ? getChildFc(eNode) : [];
}


export function insertSpies(
  code: string,
  spyFcName: string,
  spyParamHook?: (e: EsprimaNode) => string
): string {
  const r = esprima.parseScript(code, {
    "range": true, // range will serve as id
    "loc": true,
  });

  // copy as to not modify original
  let codeModified = code;

  // Process Program separately, it doesn't need any insertion of spy
  const stack: {
    offset: number;
    last: EsprimaNodeWithRangeLOC
  }[] = r.body.map(e => {
    // It should have loc and range because we called parseScript with correct params.
    if (!isHasRangeLOC(e)) {
      console.log(e);
      throw new Error(`Have you called esprima.parseScript without range and loc param ?`);
    }

    return { offset: 0, last: e };
  });

  // Note recursive version would not require offset, but it look more messy.
  // recursive version would call insertSpyCodeBefore for parent only when all
  // children are done. Parent go first in DFS.
  //
  // DFS
  while (stack.length > 0) {
    // start by last, to not invalidate the ranges by esprima.
    const {offset, last} = stack.pop()!; // cannot be undefined because stack.length > 0

    // insert spy right before the code
    const {insertedCodeLength, newCode} = insertSpyCodeBefore(codeModified, last, offset, spyFcName, spyParamHook);

    // doesn't matter that we modified the code before, because we take that in account with offset.
    codeModified = newCode;

    // get more elements here and add them to stack.
    stack.push(
      ...getChildStatements(last).map(e => {
        // It should have loc and range because we called parseScript with correct params.
        if (!isHasRangeLOC(e)) {
          console.log(e);
          throw new Error(`Have you called esprima.parseScript without range and loc param ?`);
        }

        return {
          offset: offset + insertedCodeLength,
          last: e,
        };
      })
    );
  }


  return codeModified;
}
