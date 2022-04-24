import * as esprima from 'esprima';
import * as escodegen from 'escodegen';
import {Program} from 'esprima';
import {ExpressionStatement, IfStatement, SourceLocation, VariableDeclaration} from 'estree';
import {is} from '../../enode-type-check';

// esprima.body[0] for example
type EsprimaNode = Pick<Program, "body">['body'][number];

interface HasRangeLOC {
  range: [number, number];
  loc: SourceLocation;
}

type EsprimaNodeWithRangeLOC = EsprimaNode & HasRangeLOC;

// function getCodeToEvaluate (eNode: EsprimaNodeWithRangeLOC, code: string): string | undefined {
//   type AllNodeType = typeof eNode['type'];
//
//   const m = new Map<AllNodeType, (e: any) => string>([
//     ["IfStatement", (e: IfStatement) => code.substring(e.test.range![0], e.range![1])],
//
//     // something like that.
//     // ["VariableDeclarator", (e: VariableDeclarator) => code.substring(e.init?.range![0], e.init?[1]) ]
//   ]);
//
//   const fc = m.get(eNode.type);
//
//   return fc ? fc(eNode as any) : undefined;
// }


function createSpyString (
  eNode: EsprimaNode,
  spyFcName: string,
  spyParamHook?: (e: EsprimaNode) => string,
  evaluateVar?: string[],
  ifConditionTest?: boolean, // this do not take in account if elseif else
): string {
  const [start, end] = eNode.range!;


  const evaluateVarString = !evaluateVar ? '' : `evaluateVar: {\n${evaluateVar.map(varName => `${varName}: ${varName},\n`).join('')}},`;
  const ifConditionTestString = ifConditionTest === undefined ? '' : `ifConditionTest: ${ifConditionTest},`

  const spyFirstParam = spyParamHook ? spyParamHook(eNode) : `{
  ${ifConditionTestString}
  ${evaluateVarString}
  range: [${start}, ${end}],
  loc: {
    "start": {
      "line": ${eNode.loc!.start.line},
      "column": ${eNode.loc!.start.column}
    },
    "end": {
      "line": ${eNode.loc!.end.line},
      "column": ${eNode.loc!.end.column}
    }
  }
}`;

  // Give extra line return to make is readable
  // Give extra semi-colon, in case there is an expression without semi-colon before.
  const spyString = `
;${spyFcName}(${spyFirstParam});
`;

  return spyString;
}

function insertSpy ({code, index, offset, spyString}: {
  code: string,
  index: number,
  offset: number,
  spyString: string
}): string {
  return code.substring(0, index + offset) + spyString + code.substring(index + offset, code.length);
}

function insertSpyCodeBefore(
  newCode: string,
  eNode: EsprimaNodeWithRangeLOC,
  offset: number,
  spyFcName: string,
  spyParamHook?: (e: EsprimaNode) => string
): {
  // special case with if...else where there is two block statement, the offset for each is sent in order
  insertedCodeLength: number[];
  newCode: string;
} {

  let insertedCodeLength: number[] = [];

  const m = new Map<EsprimaNode['type'], (e: any) => void>([

    ["IfStatement", (e: IfStatement) => {
      // without else
      if (!e.alternate) {
        const spyStringOpening = createSpyString(e, spyFcName, spyParamHook, undefined, true);
        insertedCodeLength.push(spyStringOpening.length);

        // add spy right after opening curvy bracket
        newCode = insertSpy({
          code: newCode,
          index: e.consequent.range![0] + 1,
          offset,
          spyString: spyStringOpening,
        });

        // `if () {} spy()`, how do you know if the test is true or false ?
        // you don't with a single if, unless you analyze what has been called previously
        // to avoid such bothersome extra work, just add an else.
        const spyStringClosing = createSpyString(e, spyFcName, spyParamHook, undefined, false);
        insertedCodeLength.push(spyStringClosing.length);

        // add spy right after closing curvy bracket
        newCode = insertSpy({
          code: newCode,
          index: e.consequent.range![1],
          offset: offset + spyStringOpening.length,
          spyString: ` else {\n${spyStringClosing}\n}`,
        });
      } else {
        console.warn('todo else in if');
      }

    }],

    ["VariableDeclaration", (e: VariableDeclaration) => {
      // i'm totally unsure about escodegen.generate(d.id), should work for variables, but the other things,
      // i don't know what they are.
      const spyString = createSpyString(e, spyFcName, spyParamHook, e.declarations.map(d => escodegen.generate(d.id)));
      insertedCodeLength.push(spyString.length);

      newCode = insertSpy({
        code: newCode,
        index: e.range![1],
        offset,
        spyString,
      });
    }],

  ]);

  const fc = m.get(eNode.type);

  if (fc) {
    fc(eNode);
  } else {
    console.warn(`No spy put because unsupported node: ${eNode.type}, range: ${JSON.stringify(eNode.range)}`);
  }

//   const evaluationPropertyCode = evaluation ? `evaluation: {
//   code: "${codeToEvaluate}"
//   evaluateTo: ${codeToEvaluate},
// },` : "";

  // ${evaluationPropertyCode}


  // insert spy string in between (this won't work as easy when adding scope, if, loop, function, etc
  return {
    insertedCodeLength,
    newCode,
  };
}

function isHasRangeLOC(a: any): a is HasRangeLOC {
  return !!a.range && !!a.loc;
}

/**
 * Most of the time, you will get [[nodes]] array.
 * But then we have the special case of if and else, where they
 * are multiple bodies.
 *
 * It will return [[consequent], [alternate]].
 *
 * Why ? Because we need a different offset for each. Indeed, when processing `if...else`,
 * we add a spy inside the if, and inside the else. thereby making two different offset,
 * for two different block statement.
 *
 * ```
 * // processing if condition, to know what the if test evaluated to, we need two spies.
 * if () {
 * spy() // offset += 5
 * } else {
 * spy() // offset += 10
 * }
 * ```
 */
function getChildStatements(eNode: EsprimaNode): EsprimaNode[][] {

  type AllNodeType = typeof eNode['type'];

  const m = new Map<AllNodeType, (next: any) => EsprimaNode[][]>([

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
      if (!next.alternate && is.BlockStatement(next.consequent)) {
        return [next.consequent.body];
      }

      /*
       * else statement with {}
       * */
      if (!!next.alternate && is.BlockStatement(next.alternate) && is.BlockStatement(next.consequent)) {
        return [next.consequent.body, next.alternate.body];
      }

      return [[]];
    }],

    ["ExpressionStatement", (next: ExpressionStatement) => {
      return [[]];
    }],
  ]);

  const getChildFc = m.get(eNode.type);

  if (!getChildFc) {
    console.warn(`${eNode.type} in ${getChildStatements.name} not processed.`);
  }

  return getChildFc ? getChildFc(eNode) : [];
}


export function insertSpies(
  code: string,
  spyFcName: string,
  spyParamHook?: (e: EsprimaNode) => string,
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

    return {offset: 0, last: e};
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
    const {
      insertedCodeLength,
      newCode
    } = insertSpyCodeBefore(codeModified, last, offset, spyFcName, spyParamHook);

    // doesn't matter that we modified the code before, because we take that in account with offset.
    codeModified = newCode;

    // get more elements here and add them to stack.
    stack.push(
      ...getChildStatements(last).map(
        block => block.map((e, i) => {
          // It should have loc and range because we called parseScript with correct params.
          if (!isHasRangeLOC(e)) {
            console.log(e);
            throw new Error(`Have you called esprima.parseScript without range and loc param ?`);
          }

          return {
            // example, in a if...else, insertedCodeLength[0] is offset of if, and insertedCodeLength[1] for else
            offset: offset + insertedCodeLength[i],
            last: e,
          };
        })
      ).flat()
    );
  }


  return codeModified;
}
