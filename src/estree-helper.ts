import {Directive, MemberExpression, MetaProperty, ModuleDeclaration, Statement} from 'estree';

// Node type already exist, we don't want to confuse it by error.
export type ENode = Directive | Statement | ModuleDeclaration;
export type ExpressionWithProperty = MemberExpression | MetaProperty;
