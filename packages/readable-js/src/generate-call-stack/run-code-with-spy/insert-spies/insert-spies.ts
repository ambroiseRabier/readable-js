import * as esprima from 'esprima';
import * as escodegen from 'escodegen';
import {
  ExpressionStatement,
  ForStatement,
  FunctionDeclaration,
  IfStatement,
  Pattern,
  SourceLocation,
  VariableDeclaration,
  WhileStatement
} from 'estree';
import {is} from '../../../enode-type-check';
import {EsprimaNode} from '../../../estree-helper';
import {MessageWithLines} from './create-spy-string/generate-readable/generate-readable';
import {SPY_FC_NAME} from '../run-code-with-spy';
import {createSpyString} from './create-spy-string/create-spy-string';


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

/**
 * This object is created for each call of the spy function.
 */
export interface DefaultSpyParams {
  evaluateVar?: boolean;
  ifConditionTest?: boolean;
  nodeCode: string;
  range: [start: number, end: number];
  loc: SourceLocation;
  messages: MessageWithLines[];
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

      // we are going to need the new offset only if there was anything in the else from start.
      if (e.alternate) {
        insertedCodeLength.push(spyStringOpening.length + spyStringClosing.length);
      }

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
      let evaluateVar; // nothing as default
      let index = e.range![1]; // by default after

      // s();
      if (is.CallExpression(e.expression)) {
        evaluateVar = [escodegen.generate(e.expression.callee)];
        index = e.range![0]; // insert before call
      }

      // i+=1;
      else if (is.AssignmentExpression(e.expression)) {
        evaluateVar = [escodegen.generate(e.expression.left)];
        index = e.range![1];
      }

      // i++;
      else if (is.UpdateExpression(e.expression) && is.Identifier(e.expression.argument)) {
        evaluateVar = [e.expression.argument.name];
        index = e.range![1];
      }

      else {
        console.warn(`No spy put because unsupported ExpressionStatement node: ${eNode.type} and ${e.type}, range: ${JSON.stringify(eNode.range)}`);
      }


      const spyString = createSpyString(originalCode, e, options, evaluateVar);
      insertedCodeLength.push(spyString.length);

      newCode = insertSpy({
        code: newCode,
        index: index,
        offset,
        spyString,
      });

    }],

    ["FunctionDeclaration", (e: FunctionDeclaration) => {
      // In js we have hoisting. (function can be declared after use)
      // would be nice to show it, but I have an issue with the offset.
      // It would need to be at the top of the stack, telling us every function declaration.
      insertedCodeLength.push(0);
    }],

    ["WhileStatement", (e: WhileStatement) => {
      const spyString = createSpyString(originalCode, e, options, undefined, true);
      insertedCodeLength.push(spyString.length);

      newCode = insertSpy({
        code: newCode,
        index: e.body.range![0] + 1, // right after opening curvy bracket
        offset,
        spyString,
      });

      // exit of while loop
      const spyStringExit = createSpyString(originalCode, e, options, undefined, false);

      newCode = insertSpy({
        code: newCode,
        index: e.range![1], // right after closing curvy bracket
        offset: offset + spyString.length,
        spyString: spyStringExit,
      });
    }],

    ['ForStatement', (e: ForStatement) => {

      const spyString = createSpyString(originalCode, e, options, undefined, true);
      insertedCodeLength.push(spyString.length); // update length only because it is before children statements

      newCode = insertSpy({
        code: newCode,
        index: e.body.range![0] + 1, // right after opening curvy bracket
        offset,
        spyString,
      });

      let updateLength = 0;

      // for loop, not always have the update, like i++
      if (!!e.update) {
        const fakeNode: ExpressionStatement = {type: 'ExpressionStatement', expression: e.update, loc: e.update.loc, range: e.update.range};
        let evaluateVar;

        // i+=1
        if (is.AssignmentExpression(e.update)) {
          evaluateVar = [escodegen.generate(e.update.left)];
        }
        // i++;
        else if (is.UpdateExpression(e.update) && is.Identifier(e.update.argument)) {
          evaluateVar = [e.update.argument.name];
        }

        const updateSpyString = createSpyString(originalCode, fakeNode, options, evaluateVar);
        updateLength = updateSpyString.length;

        newCode = insertSpy({
          code: newCode,
          index: e.body.range![1] - 1, // right before closing curvy bracket
          offset: offset + spyString.length,
          spyString: updateSpyString,
        });
      }

      // exit of for loop
      const spyStringExit = createSpyString(originalCode, e, options, undefined, false);

      newCode = insertSpy({
        code: newCode,
        index: e.range![1], // right after closing curvy bracket
        offset: offset + spyString.length + updateLength,
        spyString: spyStringExit,
      });
    }],

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

    ["WhileStatement", (next: WhileStatement) => {
      if (!is.BlockStatement(next.body)) {
        // skip for now
        return [[]];
      } else {
        return [next.body.body];
      }
    }],

    ["ForStatement", (next: ForStatement) => {
      if (!is.BlockStatement(next.body)) {
        // skip for now
        return [[]];
      } else {
        return [next.body.body];
      }
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

  /**
   * Will just remove loc in return SpyParams. Not in the message itself.
   */
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
    "loc": true, // needed for messages.
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
      ...(getChildStatements(last).map(
        (block, blockIndex) => block.map((e) => {
          // It should have loc and range because we called parseScript with correct params.
          if (!isHasRange(e)) {
            console.log(e);
            throw new Error(`Have you called esprima.parseScript without range param ?`);
          }

          return {
            // Add offset of parent stack: example, a if get a spy, that is put before the block statement of the if.
            // why is insertedCodeLength an array ?
            // --> example, in a if...else, insertedCodeLength[0] is offset of if, and insertedCodeLength[1] for else
            offset: offset + insertedCodeLength[blockIndex],

            last: e,
          };
        })
      )).flat()
    );
  }


  return codeModified;
}
