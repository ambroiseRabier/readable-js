import {Directive, MemberExpression, MetaProperty, ModuleDeclaration, Statement} from 'estree';
import {Program} from 'esprima';

// Node type already exist, we don't want to confuse it by error.
export type ENode = Directive | Statement | ModuleDeclaration;
export type ExpressionWithProperty = MemberExpression | MetaProperty;

// esprima.body[0] for example
export type EsprimaNode = Pick<Program, "body">['body'][number];
