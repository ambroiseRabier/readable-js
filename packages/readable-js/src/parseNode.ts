import {
  CallExpression,
  Directive,
  ExpressionStatement,
  IfStatement,
  ModuleDeclaration, ReturnStatement,
  Statement,
  VariableDeclaration,
  WhileStatement,
  FunctionDeclaration
} from 'estree';
import {ENode} from './estree-helper';
import {isPattern} from './enode-type-check';
import {generateReadableExpression} from './generateReadableExpression';



export interface Message {
  lineNumber?: number;
  message: string;
}

const allNodeParser = {
  "VariableDeclaration": (node : VariableDeclaration, options?: ParseNodeOptions): Message[] => {
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
        initMessage = ` and set it to <span class='readable-value'>${generateReadableExpression(dec.init, options)}</span>`;
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
  "IfStatement": (node : IfStatement, options?: ParseNodeOptions) => {
    return [{
      lineNumber: node.loc?.start.line,
      // Because if true, Skip because if false, and generateReadableExpression
      message: `##if-${node.test.range![0]}-${node.test.range![1]}## ${generateReadableExpression(node.test)}`,
    }];
  },
  "WhileStatement": (node : WhileStatement, options?: ParseNodeOptions) => {
    return [{
      lineNumber: node.loc?.start.line,
      message: `##while-${node.test.range![0]}-${node.test.range![1]}##`,
    }];
  },
  "ExpressionStatement": (node : ExpressionStatement, options?: ParseNodeOptions) => {
    return [
      {
        lineNumber: node.loc?.start.line,
        message: generateReadableExpression(node.expression, options)
      }
    ];
  },
  "ReturnStatement": (node : ReturnStatement, options?: ParseNodeOptions) => {
    return [{
      lineNumber: node.loc?.start.line,
      message: 'todo',
    }];
  },
  "CallExpression": (node : CallExpression, options?: ParseNodeOptions) => {
    return [{
      lineNumber: node.loc?.start.line,
      message: generateReadableExpression(node),
    }];
  },
  "FunctionDeclaration": (node : FunctionDeclaration, options?: ParseNodeOptions) => {
    return [{
      lineNumber: node.loc?.start.line,
      message: `Declare the function ${node.id?.name}`,
    }];
  },
};

type allNodeParserKeys = keyof typeof allNodeParser;

function isKey(s: string): s is allNodeParserKeys {
  return allNodeParser.hasOwnProperty(s)
}

export interface ParseNodeOptions {
  replaceVar?: boolean;
}

// equivalent to readableNode
// This would be nice to make it public, parsing only the current node
// would be more performant.
export function parseNode(node: ENode, options?: ParseNodeOptions): Message[] {
  if (!isKey(node.type)) {
    throw new Error('Missing node parser');
  }

  const parser = allNodeParser[node.type];

  if (!parser) {
    console.warn(`unknown ${node.type}`)
    return [];
  }

  const messages: Message[] = parser(node as any, options);

  return messages;
}
