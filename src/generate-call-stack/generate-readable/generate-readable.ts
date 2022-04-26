import {EsprimaNode} from '../../estree-helper';
import {is, isPattern} from '../../enode-type-check';
import {
  AssignmentExpression,
  AssignmentOperator, CallExpression,
  Expression,
  ExpressionStatement,
  IfStatement, ObjectExpression, UpdateExpression,
  VariableDeclaration
} from 'estree';
import {Options} from '../insert-spies/insert-spies';
import * as escodegen from 'escodegen';

const ge = generateReadableExpression;

function generateReadableExpression(e: Expression) {
  const m = new Map<Expression["type"], (e: Expression|any) => string>([

  ]);
}

export function generateReadable(eNode: EsprimaNode, options: Required<Options>, evaluateVar?: string[], ifConditionTest?: boolean): string[] {
  const m = new Map<EsprimaNode['type'], (e: EsprimaNode|any) => string[]>([

    // return multiple message, one for each variable declaration
    ["VariableDeclaration", (e: VariableDeclaration) => {
      if (!evaluateVar) {
        throw new Error('Unexpected case: evaluateVar undefined in generateReadable VariableDeclaration parser.');
      }

      const messages = e.declarations.map((dec, i) => {
        const varToName = new Map([
          ['let', 'variable'],
          ['var', 'variable'],
          ['const', 'constant'],
        ]);

        let createMessage = '';
        if (isPattern.Identifier(dec.id)) {
          createMessage = `Create the ${varToName.get(e.kind)} <span class="${options.classNames.variable}">${dec.id.name}</span>`;
        }

        let initMessage = '';
        if (!!dec.init) {
          initMessage = ` and set it to <span class="${options.classNames.value}">${"${"+evaluateVar[i]+"}"}</span>`;
        }

        let message = createMessage + initMessage;

        return message;
      });


      return messages;
    }],

    ["IfStatement", (e: IfStatement) => {
      return [
        `${ifConditionTest ? 'Because' : 'Skip because'}`
      ];
    }],

    ["ExpressionStatement", (e: ExpressionStatement) => {
      const m2 = new Map<
        ExpressionStatement['expression']['type'],
        (exp: Expression|any) => string[]
        >([
        ['CallExpression', (exp: CallExpression) => [`Call function ${evaluateVar![0]}`]],
        ['UpdateExpression', (exp: UpdateExpression) => [
          `Increment <span class="${options.classNames.variable}">${evaluateVar![0]}</span> by <span class="${options.classNames.value}">1</span>`
        ]],
        ['AssignmentExpression', (exp: AssignmentExpression) => {
          const varValue = `<span class="${options.classNames.value}">` + "${"+evaluateVar![0]+"}" + "</span>";
          const varName = `<span class="${options.classNames.variable}">${evaluateVar![0]}</span>`;
          const right = `<span class="${options.classNames.expression}">${escodegen.generate(exp.right)}</span>`;
          const mapAssignmentExp = new Map<AssignmentOperator, (a: AssignmentExpression) => string>([
            ['=', (a: AssignmentExpression) => `set ${varName} to ${varValue}`],
            ['+=', (a: AssignmentExpression) => `add ${right} to ${varName} and set ${varName} to ${varValue}`],
            ['-=', (a: AssignmentExpression) => `subtract ${right} from ${varName} and set ${varName} to ${varValue}`],
            ['*=', (a: AssignmentExpression) => `multiply ${varName} by ${right} and set ${varName} to ${varValue}`],
            ['/=', (a: AssignmentExpression) => `divide ${varName} by ${right} and set ${varName} to ${varValue}`],
            ['%=', (a: AssignmentExpression) => `divide ${varName} by ${right} and set ${varName} to the remainder:  ${varValue}`],
            ['**=', (a: AssignmentExpression) => ``],
            ['<<=', (a: AssignmentExpression) => ``],
            ['>>=', (a: AssignmentExpression) => ``],
            ['>>>=', (a: AssignmentExpression) => ``],
            ['|=', (a: AssignmentExpression) => ``],
            ['^=', (a: AssignmentExpression) => ``],
            ['&=', (a: AssignmentExpression) => ``],
          ]);

          const mapAssignmentExpGet = mapAssignmentExp.get(exp.operator);

          return mapAssignmentExpGet ? [mapAssignmentExpGet(exp)] : [''];
        }]
      ]);

      const m2Get = m2.get(e.expression.type);


      return m2Get ? m2Get(e.expression) : [''];
    }]
  ]);

  const parser = m.get(eNode.type);

  if (parser) {
    return parser(eNode);
  } else {
    console.warn(`No readable generated for type ${eNode.type}.`)
    return [''];
  }
}
