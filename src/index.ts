import * as esprima from 'esprima';
import {Directive, Statement, ModuleDeclaration} from 'estree'
import * as util from 'util';
import {parseNode} from './parseNode';

// do i need that ?
// const util: typeof _util = _util;





export class ReadableJS {
  static read (code: string): string {
    if (code.length === 0) {
      return '';
    }

    const r = esprima.parseScript(code, {
      "range": true,
      "loc": true
    });

    const perLine = r.body.map((e, i) => parseNode(e).map(e2 => e2.message)).flat();

    return perLine.join('\n');
  }
}
