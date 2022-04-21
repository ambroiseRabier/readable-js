import {ReadableJS} from '../src';

function assertMessage(code: string, message: string): void {
  expect(
    ReadableJS.read(code)
  ).toEqual(
    message
  );
}

it('should return nothing for nothing', function () {
  assertMessage('', '');
});

it('variables declarations', function () {
  assertMessage("var i = 2", "Create the variable <span class='readable-variable'>i</span> and set it to <span class='readable-value'>2</span>");
  assertMessage("var i = 2, j = 3;",
    `Create the variable <span class='readable-variable'>i</span> and set it to <span class='readable-value'>2</span>
Create the variable <span class='readable-variable'>j</span> and set it to <span class='readable-value'>3</span>`);
  assertMessage("let o = 5", "Create the variable <span class='readable-variable'>o</span> and set it to <span class='readable-value'>5</span>")
  assertMessage("const p = 21", "Create the constant <span class='readable-variable'>p</span> and set it to <span class='readable-value'>21</span>")
});
