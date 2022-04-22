import {
  Expression,
  VariableDeclarator,
  CallExpression,
  AssignmentExpression,
  BinaryExpression,
  ObjectExpression,
  Identifier,
  MemberExpression, MetaProperty, PrivateIdentifier,
  Literal,
  Pattern,
  FunctionExpression, AssignmentOperator, BinaryOperator
} from 'estree';
import {is} from './enode-type-check';
import {ExpressionWithProperty} from './estree-helper';
import {ParseNodeOptions} from './parseNode';

// not suer this work, maybe it can be refactored
// need to evaluate value at some point..
function generateReadableValue(left?: Expression | Pattern, right?: Expression | Pattern, options?: ParseNodeOptions) {
  // not sure when that is used
  if (right?.type === "FunctionExpression") {
    console.warn('generateReadableValue unknown path');
    return "this function";
  }

  if (!!left && is.Identifier(left) && options?.replaceVar) {
    return (
      `##replace-${left.name}##`
    );
  }

  return generateReadableExpression(right);
}


// equivalent to truthy function
function formatBinary(node, verbiage, negation?: boolean) {
  let isOrNotText = '';

  // ignore if undefined
  if (negation === true) {
    isOrNotText = " is not";
  } else if (negation === false) {
    isOrNotText = " is";
  }

  return generateReadableExpression(node["left"]) + isOrNotText + verbiage + generateReadableExpression(node["right"]);
}



const converter: {
  AssignmentExpression: (e: AssignmentExpression, options?: ParseNodeOptions) => string;
  BinaryExpression: (e: BinaryExpression, options?: ParseNodeOptions) => string;
  ObjectExpression: (e: ObjectExpression, options?: ParseNodeOptions) => string;
  CallExpression:  (e: CallExpression, options?: ParseNodeOptions) => string;
  MemberExpression:  (e: MemberExpression, options?: ParseNodeOptions) => string;
  Literal:  (e: Literal, options?: ParseNodeOptions) => string;
  Identifier:  (e: Identifier, options?: ParseNodeOptions) => string;
  VariableDeclarator:  (e: VariableDeclarator, options?: ParseNodeOptions) => string;
  FunctionExpression:  (e: FunctionExpression, options?: ParseNodeOptions) => string;
} = {
  "AssignmentExpression": (e: AssignmentExpression, options) => {
    // note: he evaluate the expression on the right `foo = 1 + bar`, 1+bar is evaluated, I need to put a marker somewhere
    const map = new Map<AssignmentOperator, (e: AssignmentExpression) => string>([
      ['=', (e: AssignmentExpression) => `set ${ge(e['left'])} to ${generateReadableValue(e['left'], e['right'], options)}`],
      ['+=', (e: AssignmentExpression) => `add ${ge(e['right'])} to ${ge(e['left'])} and set ${ge(e['left'])} to ${generateReadableValue(e['left'], e['right'])}`],
      ['-=', (e: AssignmentExpression) => `subtract ${ge(e['right'])} from ${ge(e['left'])} and set ${ge(e['left'])} to ${generateReadableValue(e['left'], e['right'])}`],
      ['*=', (e: AssignmentExpression) => `multiply ${ge(e['left'])} by ${ge(e['right'])} and set ${ge(e['left'])} to ${generateReadableValue(e['left'], e['right'])}`],
      ['/=', (e: AssignmentExpression) => `divide ${ge(e['left'])} to ${ge(e['right'])} and set ${ge(e['left'])} to ${generateReadableValue(e['left'], e['right'])}`],
      ['%=', (e: AssignmentExpression) => `divide ${ge(e['left'])} to ${ge(e['right'])} and set ${ge(e['left'])} to the remainder:  ${generateReadableValue(e['left'], e['right'])}`],
      ['**=', (e: AssignmentExpression) => ``],
      ['<<=', (e: AssignmentExpression) => ``],
      ['>>=', (e: AssignmentExpression) => ``],
      ['>>>=', (e: AssignmentExpression) => ``],
      ['|=', (e: AssignmentExpression) => ``],
      ['^=', (e: AssignmentExpression) => ``],
      ['&=', (e: AssignmentExpression) => ``],
    ]);

    return map.get(e.operator)!(e);
  },
  "BinaryExpression": (e: BinaryExpression) => {
    const map = new Map<BinaryOperator, (e: BinaryExpression) => string>([
      ['==', (e: BinaryExpression) => formatBinary(e, " equal to ")],
      ['!=', (e: BinaryExpression) => formatBinary(e, " different ")],
      ['===', (e: BinaryExpression) => formatBinary(e, " strict equal to ")],
      ['!==', (e: BinaryExpression) => formatBinary(e, " strict different ")],
      ['<', (e: BinaryExpression) => formatBinary(e, " less than ")],
      ['<=', (e: BinaryExpression) => formatBinary(e, " less than or equal to ")],
      ['>', (e: BinaryExpression) => formatBinary(e, " greater than ")],
      ['>=', (e: BinaryExpression) => formatBinary(e, " greater than or equal to ")],
      ['<<', (e: BinaryExpression) => ''],
      ['>>', (e: BinaryExpression) => ''],
      ['>>>', (e: BinaryExpression) => ''],
      ['+', (e: BinaryExpression) => formatBinary(e, " plus ")],
      ['-', (e: BinaryExpression) => formatBinary(e, " minus ")],
      ['*', (e: BinaryExpression) => formatBinary(e, " times ")],
      ['/', (e: BinaryExpression) => formatBinary(e, " divided by ")],
      ['%', (e: BinaryExpression) => formatBinary(e, " modulo ")],
      ['**', (e: BinaryExpression) => ''],
      ['|', (e: BinaryExpression) => formatBinary(e, " bitwise-or ")],
      ['^', (e: BinaryExpression) => formatBinary(e, " bitwise-and ")],
      ['&', (e: BinaryExpression) => ''],
      ['in', (e: BinaryExpression) => ''],
      ['instanceof', (e: BinaryExpression) => ''],
    ]);

    return map.get(e.operator)!(e);
  },
  "ObjectExpression": (e: ObjectExpression) => "an object",
  "CallExpression": (e: CallExpression) => {
    if (e.callee.type === "Identifier"
     || e.callee.type === "MemberExpression") {
    }

    if (is.Identifier(e.callee)) {
      return generateReadableExpression(e.callee);
      // ignored compile thing, probably something missing with else
    } else if (is.MemberExpression(e.callee)) {
      if (is.Super(e.callee.object)) {
        return 'super'; // that's new
      } else { // is Expression
        return generateReadableExpression(e.callee.object);
        // ignored compile thing, probably something missing with else
      }
    } else if (is.ExpressionWithProperty(e.callee)) {
      return e.callee.property.name;
    } else {
      throw new Error(`Unknown CallExpression of type: ${e.callee.type}`)
    }
  },
  "MemberExpression": (e: MemberExpression) => {
    if (is.Super(e.object)) {
      return 'super';
    } else { // is Expression
      // strange, we don't process this as in CallExpression
      return generateReadableExpression(e.object)
        + '.'
        + generateReadableExpression(e.property); // can be PrivateIdentifier too
    }
  },
  "Literal": (e: Literal) => e.value + '',
  "Identifier": (e: Identifier) => e.name,
  "VariableDeclarator": (e: VariableDeclarator) => {
    if (is.FunctionExpression(e.init)) {
      return 'this function';
    } else {
      return generateReadableExpression(e.id)
    }
  },
  "FunctionExpression":  (e: FunctionExpression) => 'this function'
};


export function generateReadableExpression(exp?: Expression | PrivateIdentifier | Pattern, options?: ParseNodeOptions): string {
  if (!exp) {
    return '';
  }

  if ((converter as any).hasOwnProperty(exp.type)) {
    return converter[exp.type](exp, options);
  } else {
    console.warn(`Not found converter for: ${exp.type}`)
    return '';
  }
}

const ge = generateReadableExpression;
