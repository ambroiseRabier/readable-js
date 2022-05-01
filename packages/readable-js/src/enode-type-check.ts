import {
  VariableDeclaration,
  IfStatement,
  WhileStatement,
  ExpressionStatement,
  ReturnStatement,
  CallExpression,
  Identifier,
  Pattern,
  MemberExpression,
  Super,
  FunctionExpression,
  Literal,
  BlockStatement, AssignmentExpression, UpdateExpression
} from 'estree';
import {ENode, ExpressionWithProperty} from './estree-helper';


export const is = {
  "VariableDeclaration": (node: ENode): node is VariableDeclaration => {
    return node.type === "VariableDeclaration";
  },
  "IfStatement": (node: ENode): node is IfStatement => {
    return node.type === "IfStatement";
  },
  "WhileStatement": (node: ENode): node is WhileStatement => {
    return node.type === "WhileStatement";
  },
  "ExpressionStatement": (node: ENode): node is ExpressionStatement => {
    return node.type === "ExpressionStatement";
  },
  "BlockStatement": (node: ENode): node is BlockStatement => {
    return node.type === "BlockStatement";
  },
  "ReturnStatement": (node: ENode): node is ReturnStatement => {
    return node.type === "ReturnStatement";
  },
  "CallExpression": (a: any): a is CallExpression => {
    return a.type === "CallExpression";
  },
  "Identifier": (a: any): a is Identifier => {
    return a.type === "Identifier";
  },
  "Literal": (a: any): a is Literal => {
    return a.type === "Literal";
  },
  "MemberExpression": (a: any): a is MemberExpression => {
    return a.type === "MemberExpression";
  },
  "Super": (a: any): a is Super => {
    return a.type === "Super";
  },
  "ExpressionWithProperty": (a: any): a is ExpressionWithProperty => {
    return a.type === "MemberExpression" || a.type === "MetaProperty";
  },
  "FunctionExpression": (a: any): a is FunctionExpression => {
    return a.type === "FunctionExpression";
  },
  "AssignmentExpression": (a: any): a is AssignmentExpression => {
    return a.type === "AssignmentExpression";
  },
  "UpdateExpression": (a: any): a is UpdateExpression => {
    return a.type === "UpdateExpression";
  },
};

export const isPattern = {
  "Identifier": (pattern: Pattern): pattern is Identifier => {
    return pattern.type === 'Identifier';
  }
};
