import * as esprima from 'esprima';
import {Directive, Statement, ModuleDeclaration} from 'estree';
import * as util from 'util';
import {Message, parseNode} from './parseNode';
import {Program} from 'esprima';
import {executeEvaluateVar} from './execute-evaluate-var/execute-evaluate-var';
import {getPreviousCode, getPreviousCodeIncluded} from './get-previous-code/get-previous-code';
import {executeEvaluateExpression} from './execute-evaluate-expression/execute-evaluate-expression';


export class ReadableJS {


  // execute the code and evaluate variable at the last line
  // step is the index in esprima body.
  static getEvaluatedMessageForIndex(code: string, esprimaBodyIndex: number, esprima: Program) {
    function replaceVar() {
      const variablesToRead: string[] = [];

      for (let i = 0; i < parsedNode.length; i++) {
        const m = parsedNode[i].message.match(/##replace-(.*)##/);

        if (m) {
          variablesToRead.push(m[1]);
        }
      }

      // don't execute code if no variable to replace
      if (variablesToRead.length === 0) {
        return;
      }

      const evaluation: Map<string, any> = executeEvaluateVar(previousCodeIncluded, variablesToRead);

      for (const [key, value] of evaluation.entries()) {
        for (let i = 0; i < parsedNode.length; i++) {
          parsedNode[i].message = parsedNode[i].message.replace(
            `##replace-${key}##`,
            value
          )
        }
      }
    }

    function replaceIf() {
      const m = parsedNode[0].message.match(/##if-(\d+)-(\d+)##/);

      if (m) {
        const range = [parseInt(m[1]), parseInt(m[2])]
        const expression = previousCodeIncluded.substring(parseInt(m[1]), parseInt(m[2]));
        const evaluateTo = executeEvaluateExpression(previousCode, expression);
        parsedNode[0].message = parsedNode[0].message.replace(`##if-${range[0]}-${range[1]}##`, evaluateTo ? 'Because' : 'Skip because');
      }
    }

    const parsedNode = parseNode(esprima.body[esprimaBodyIndex], {replaceVar: true});
    const previousCode = getPreviousCode(code, esprimaBodyIndex, esprima);
    const previousCodeIncluded = getPreviousCodeIncluded(code, esprimaBodyIndex, esprima);

    // suppose only one to replace per instruction, for variable assignment that should be correct

    replaceVar();
    replaceIf();

    //

    return parsedNode.map(e => e.message).join('\n');
  }


  static getMessages(code: string): Message[][] {
    if (code.length === 0) {
      return []
    }

    const r = esprima.parseScript(code, {
      "range": true,
      "loc": true
    });

    return r.body.map(e => parseNode(e));
  }

  static read(code: string): string {
    let perLine = ReadableJS.getMessages(code).flat().map(e => e.message);

    return perLine.join('\n');
  }

}
