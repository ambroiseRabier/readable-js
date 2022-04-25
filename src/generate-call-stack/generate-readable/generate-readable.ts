import {EsprimaNode} from '../../estree-helper';
import {isPattern} from '../../enode-type-check';
import {VariableDeclaration} from 'estree';
import {Options} from '../insert-spies/insert-spies';


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
          createMessage = `Create the ${varToName.get(e.kind)} <span class='${options.classNames.variable}'>${dec.id.name}</span>`;
        }

        let initMessage = '';
        if (!!dec.init) {
          initMessage = ` and set it to <span class='${options.classNames.value}'>${"${"+evaluateVar[i]+"}"}</span>`;
        }

        let message = createMessage + initMessage;

        return message;
      });


      return messages;
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
