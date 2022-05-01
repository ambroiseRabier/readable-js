
// note: the node code could be found ulteriorly using range, but I find it more user friendly this way.
import {EsprimaNode} from '../../../../estree-helper';
import {generateReadable, MessageWithLines} from '../generate-readable/generate-readable';
import {Options} from '../insert-spies';

export function createSpyString (
  originalCode: string,
  eNode: EsprimaNode,
  options: Required<Options>,
  evaluateVar?: string[],
  ifConditionTest?: boolean, // this do not take in account if elseif else
): string {
  const [start, end] = eNode.range!;

  const evaluateVarString = !evaluateVar ? '' : `\n  evaluateVar: {\n    ${evaluateVar.map(varName => `${varName}: ${varName}`).join(',\n    ')},\n  },`;
  const ifConditionTestString = ifConditionTest === undefined ? '' : `\n  ifConditionTest: ${ifConditionTest},`;
  const nodeCode = unescape(`\n  nodeCode: %60${originalCode.substring(eNode.range![0], eNode.range![1])}%60,`); // %60 == `
  const range = !options.range ? '' : `\n  range: [${start}, ${end}],`;
  const loc = !options.loc ? '' : `\n  loc: {
    "start": {
      "line": ${eNode.loc!.start.line},
      "column": ${eNode.loc!.start.column}
    },
    "end": {
      "line": ${eNode.loc!.end.line},
      "column": ${eNode.loc!.end.column}
    }
  },`;
  const formatMessage = (e: MessageWithLines): string => `[${e[0]}, ${e[1]}, \`${e[2]}\`]`;
  const messages = `\n  messages: [\n    ${generateReadable(eNode, options, evaluateVar, ifConditionTest).map(formatMessage).join(',\n    ')}\n  ],`;

  const assembled = ifConditionTestString + evaluateVarString + nodeCode + messages + range + loc + '\n';

  const spyFirstParam = options.spyParamHook ? options.spyParamHook(eNode) : `{${assembled}}`;

  // Give extra line return to make is readable
  // Give extra semi-colon, in case there is an expression without semi-colon before.
  const spyString = `
;${options.spyFcName}(${spyFirstParam});
`;

  return spyString;
}
