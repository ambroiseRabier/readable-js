import * as esprima from 'esprima';
import {Directive, Statement, ModuleDeclaration} from 'estree';
import * as util from 'util';
import {Message, parseNode} from './parseNode';
import {Program} from 'esprima';

// do i need that ?
// const util: typeof _util = _util;


export class ReadableJS {

  // I don't need that, I can just evaluate the var after the expression ?
  static evaluateExpression(previousCode: string, expression: string) {
    return Function(`${previousCode}; return ${expression};`)();
  }

  static evaluateVar(previousCode: string, variableIdentifier: string[]): Map<string, any> {
    const values = Function(`${previousCode}; return [${variableIdentifier.join(',')}]`)();
    const map = new Map();

    for (let i = 0; i < variableIdentifier.length; i++) {
      map.set(variableIdentifier[i], values[i]);
    }

    return map;
  }

  // execute the code and evaluate variable at the last line
  // step is the index in esprima body.
  static getEvaluatedMessageForIndex(code: string, esprimaBodyIndex: number, esprima: Program) {
    const previousCode = ReadableJS.getPreviousCode(code, esprimaBodyIndex+1, esprima);
    const parsedNode = parseNode(esprima.body[esprimaBodyIndex]);

    // suppose only one to replace per instruction, for variable assignment that should be correct

    const variablesToRead: string[] = [];

    for (let i = 0; i < parsedNode.length; i++) {
      const m = parsedNode[i].message.match(/##replace-(.*)##/);

      if (m) {
        variablesToRead.push(m[1]);
      }
    }

    const evaluation: Map<string, any> = ReadableJS.evaluateVar(previousCode, variablesToRead);

    for (const [key, value] of evaluation.entries()) {
      for (let i = 0; i < parsedNode.length; i++) {
        const k = parsedNode[i].message;
        parsedNode[i].message = parsedNode[i].message.replace(
          `##replace-${key}##`,
          value
        )
      }
    }

    return parsedNode.map(e => e.message).join('\n');
  }

  static getPreviousCode(code: string, esprimaBodyIndex: number, esprima: Program): string {
    // return full code if index >=
    if (esprimaBodyIndex >= esprima.body.length) {
      return code;
    }

    const range = esprima.body[esprimaBodyIndex].range!; // why would it be undefined ??
    return code.substring(0, range[0]);
  }

  static getMessages(code: string): Message[][] {
    if (code.length === 0) {
      return [];
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
