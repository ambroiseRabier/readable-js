import * as esprima from 'esprima';
import {Directive, Statement, ModuleDeclaration} from 'estree'
import * as util from 'util';
import {Message, parseNode} from './parseNode';

// do i need that ?
// const util: typeof _util = _util;





export class ReadableJS {
  static getMessages(code: string): Message[][] {
    if (code.length === 0) {
      return [];
    }

    const r = esprima.parseScript(code, {
      "range": true,
      "loc": true
    });

    return r.body.map((e, i) => parseNode(e));
  }

  static read (code: string): string {
    let perLine  = ReadableJS.getMessages(code).flat().map(e => e.message);

    return perLine.join('\n');
  }
}
