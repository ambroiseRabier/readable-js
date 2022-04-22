import {
  CallExpression,
  Directive,
  ExpressionStatement,
  IfStatement,
  ModuleDeclaration, ReturnStatement,
  Statement,
  VariableDeclaration,
  WhileStatement
} from 'estree';
import util from 'util';
import {ENode} from './estree-helper';
import {isPattern} from './enode-type-check';
import {generateReadableExpression} from './generateReadableExpression';


// Has to reconsider if that is useful
function someLog(node: Directive | Statement | ModuleDeclaration) {
  const a = util.inspect(node, { depth: 100, colors: true });

  // will log into all.test.ts when running jest (on webstorm)
  console.log(a);
}

export interface Message {
  lineNumber?: number;
  message: string;
}

const allNodeParser = {
  "VariableDeclaration": (node : VariableDeclaration): Message[] => {
    const messages = node.declarations.map(dec => {
      const varToName = new Map([
        ['let', 'variable'],
        ['var', 'variable'],
        ['const', 'constant'],
      ]);

      let createMessage = '';
      if (isPattern.Identifier(dec.id)) {
        createMessage = `Create the ${varToName.get(node.kind)} <span class='readable-variable'>${dec.id.name}</span>`;
      }

      let initMessage = '';
      if (!!dec.init) {
        initMessage = ` and set it to <span class='readable-value'>${generateReadableExpression(dec.init)}</span>`;
      }

      let message =  createMessage + initMessage;

      return {
        lineNumber: node.loc?.start.line,
        message: message,
        // timeline: , // not sure what he want to do with it.
      };
    });

    return messages;
  },
  "IfStatement": (node : IfStatement) => {

  },
  "WhileStatement": (node : WhileStatement) => {

  },
  "ExpressionStatement": (node : ExpressionStatement) => {
    return [
      {
        lineNumber: node.loc?.start.line,
        message: generateReadableExpression(node.expression)
      }
    ];
  },
  "ReturnStatement": (node : ReturnStatement) => {

  },
  "CallExpression": (node : CallExpression) => {

  },
};

type allNodeParserKeys = keyof typeof allNodeParser;

function isKey(s: string): s is allNodeParserKeys {
  return allNodeParser.hasOwnProperty(s)
}


// equivalent to readableNode
// This would be nice to make it public, parsing only the current node
// would be more performant.
export function parseNode(node: ENode): Message[] {
  // equivalent to pp
  someLog(node);

  if (!isKey(node.type)) {
    throw new Error('Missing node parser');
  }

  const parser = allNodeParser[node.type];
  const messages: Message[] = parser(node as any) as any;

  return messages;
}
