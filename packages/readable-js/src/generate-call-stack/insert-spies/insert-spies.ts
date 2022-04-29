import * as esprima from 'esprima';
import * as escodegen from 'escodegen';
import {
  Expression,
  UpdateExpression,
  ExpressionStatement,
  IfStatement,
  VariableDeclaration,
  AssignmentExpression,
  Identifier,
  Pattern,
  FunctionDeclaration,
  CallExpression
} from 'estree';
import {is} from '../../enode-type-check';
import {EsprimaNode} from '../../estree-helper';
import {generateReadable} from '../generate-readable/generate-readable';
import {SPY_FC_NAME} from '../generate-call-stack';



interface HasRange {
  range: [number, number];
}

type EsprimaNodeWithRange = EsprimaNode & HasRange;

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

// note: the node code could be found ulteriorly using range, but I find it more user friendly this way.
function createSpyString (
  originalCode: string,
  eNode: EsprimaNode,
  options: Required<Options>,
  evaluateVar?: string[],
  ifConditionTest?: boolean, // this do not take in account if elseif else
): string {
  const [start, end] = eNode.range!;

  const evaluateVarString = !evaluateVar ? '' : `\n  evaluateVar: {\n    ${evaluateVar.map(varName => `${varName}: ${varName}`).join(',\n    ')},\n  },`;
  const ifConditionTestString = ifConditionTest === undefined ? '' : `\n  ifConditionTest: ${ifConditionTest},`;
  const nodeCode = unescape(`\n  nodeCode: %60${originalCode.substring(eNode.range![0], eNode.range![1])}%60,`); // %60 == `
  const range = !options.range ? '' : `\n  range: [${start}, ${end}],`;
  const loc = !options.loc ? '' : `\n  loc: {
    "start": {
      "line": ${eNode.loc!.start.line},
      "column": ${eNode.loc!.start.column}
    },
    "end": {
      "line": ${eNode.loc!.end.line},
      "column": ${eNode.loc!.end.column}
    }
  },`;
  const messages = `\n  messages: [\n    ${generateReadable(eNode, options, evaluateVar, ifConditionTest).join(',\n    ')},\n  ],`;

  const assembled = ifConditionTestString + evaluateVarString + nodeCode + messages + range + loc + '\n';

  const spyFirstParam = options.spyParamHook ? options.spyParamHook(eNode) : `{${assembled}}`;

  // Give extra line return to make is readable
  // Give extra semi-colon, in case there is an expression without semi-colon before.
  const spyString = `
;${options.spyFcName}(${spyFirstParam});
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

function insertSpyCodeBefore({originalCode, newCode, eNode, offset, options}: {
  originalCode: string;
  newCode: string,
  eNode: EsprimaNodeWithRange,
  offset: number,
  options: Required<Options>,
}): {
  // special case with if...else where there is two block statement, the offset for each is sent in order
  insertedCodeLength: number[];
  newCode: string;
} {

  let insertedCodeLength: number[] = [];

  const m = new Map<EsprimaNode['type'] | Pattern["type"], (e: EsprimaNode|Pattern|any) => void>([

    ["IfStatement", (e: IfStatement) => {
      const spyStringOpening = createSpyString(originalCode, e, options, undefined, true);
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
      const spyStringClosing = createSpyString(originalCode, e, options, undefined, false);
      insertedCodeLength.push(spyStringClosing.length);

      // add spy right after closing curvy bracket
      newCode = insertSpy({
        code: newCode,

        // without else, or with else
        index: !e.alternate ? e.consequent.range![1] : e.alternate.range![0] + 1,

        offset: offset + spyStringOpening.length,

        // without else, or with else
        spyString: !e.alternate ? ` else {\n${spyStringClosing}\n}` : spyStringClosing,
      });


    }],

    ["VariableDeclaration", (e: VariableDeclaration) => {
      // i'm totally unsure about escodegen.generate(d.id), should work for variables, but the other things,
      // i don't know what they are.
      const spyString = createSpyString(originalCode, e, options, e.declarations.map(d => escodegen.generate(d.id)));
      insertedCodeLength.push(spyString.length);

      newCode = insertSpy({
        code: newCode,
        index: e.range![1],
        offset,
        spyString,
      });
    }],

    // can be i++; or i+=1 or 1+1 or c()
    ["ExpressionStatement", (e: ExpressionStatement) => {
      if (is.CallExpression(e.expression)) {
        const fcName = escodegen.generate(e.expression.callee);

        const spyString = createSpyString(originalCode, e, options, [fcName]);
        insertedCodeLength.push(spyString.length);

        newCode = insertSpy({
          code: newCode,
          index: e.range![0], // insert before the call
          offset,
          spyString,
        });

        return;
      }

      const getIdentifierName = new Map<Expression["type"], any>([
        // i++;
        ['UpdateExpression', (exp: UpdateExpression) => (getIdentifierName.get(exp.argument.type) ?? (() => ''))(exp.argument)],

        // i+=1;
        ['AssignmentExpression', (exp: AssignmentExpression) => escodegen.generate(exp.left)],

        // i;
        ['Identifier', (exp: Identifier) => exp.name],

        // s();
        // too different...
        //['CallExpression', (exp: CallExpression) => escodegen.generate(exp.callee)]
      ]);

      const getName = getIdentifierName.get(e.expression.type);


      if (getName) {
        const name = getName(e.expression);

        const spyString = createSpyString(originalCode, e, options, [name]);
        insertedCodeLength.push(spyString.length);

        newCode = insertSpy({
          code: newCode,
          index: e.range![1],
          offset,
          spyString,
        });

      } else {
        // do nothing, unsupported expression.
      }

    }],

    ["FunctionDeclaration", (e: FunctionDeclaration) => {
      // In js we have hoisting. (function can be declared after use)
      // would be nice to show it, but I have an issue with the offset.
      // It would need to be at the top of the stack, telling us every function declaration.
      insertedCodeLength.push(0);
    }]

  ]);

  const fc = m.get(eNode.type);

  if (fc) {
    fc(eNode);
  } else {
    console.warn(`No spy put because unsupported node: ${eNode.type}, range: ${JSON.stringify(eNode.range)}`);
  }

  return {
    insertedCodeLength,
    newCode,
  };
}

function isHasRange(a: any): a is HasRange {
  return !!a.range;
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

    ["VariableDeclaration", (next: VariableDeclaration) => {
      return [[]];
    }],

    ["FunctionDeclaration", (next: FunctionDeclaration) => {
      return [next.body.body];
    }],


  ]);

  const getChildFc = m.get(eNode.type);

  if (!getChildFc) {
    console.warn(`${eNode.type} in ${getChildStatements.name} not processed.`);
  }

  return getChildFc ? getChildFc(eNode) : [];
}

export interface Options {
  spyFcName?: string;
  spyParamHook?: (e: EsprimaNode) => string;
  range?: boolean;
  loc?: boolean;
  classNames?: {
    value?: string;
    variable?: string;
    expression?: string;
  }
}

export function insertSpies(
  code: string,
  options?: Options,
): string {
  const defaultOptions: Options = {
    spyFcName: SPY_FC_NAME,
    spyParamHook: undefined,
    range: true,
    loc: true,
    classNames: {
      value: 'readable-value',
      variable: 'readable-variable',
      expression: 'readable-expression',
    }
  };

  options = {...defaultOptions, ...options};

  // options are just for the rendered spy code, I need range here.
  // but loc is not needed for inserting spies
  const r = esprima.parseScript(code, {
    "range": true, // range will serve as id
    "loc": options.loc,
  });

  // copy as to not modify original
  let codeModified = code;

  // Process Program separately, it doesn't need any insertion of spy
  const stack: {
    offset: number;
    last: EsprimaNodeWithRange;
  }[] = r.body.map(e => {
    // It should have loc and range because we called parseScript with correct params.
    if (!isHasRange(e)) {
      console.log(e);
      throw new Error(`Have you called esprima.parseScript without range param ?`);
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

    // insert spy right before or after the code
    const {
      insertedCodeLength,
      newCode,
    } = insertSpyCodeBefore({
      originalCode: code,
      newCode: codeModified,
      eNode: last,
      offset,
      options: options as Required<Options>, // a bit false, because spyParamHook can be undefined
    });

    // doesn't matter that we modified the code before, because we take that in account with offset.
    codeModified = newCode;

    // get more elements here and add them to stack.
    stack.push(
      ...getChildStatements(last).map(
        block => block.map((e, i) => {
          // It should have loc and range because we called parseScript with correct params.
          if (!isHasRange(e)) {
            console.log(e);
            throw new Error(`Have you called esprima.parseScript without range and loc param ?`);
          }

          return {
            // Add offset of parent stack: example, a if get a spy, that is put before the block statement of the if.
            // why is insertedCodeLength an array ?
            // --> example, in a if...else, insertedCodeLength[0] is offset of if, and insertedCodeLength[1] for else
            offset: offset + insertedCodeLength[i],

            last: e,
          };
        })
      ).flat()
    );
  }


  return codeModified;
}
