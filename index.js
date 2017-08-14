const StepManager = require('./step-manager');
const assert = require('assert-diff');

module.exports = function expectGen(generator, ...args) {
  return new StepManager({
    generator,
    args,
    deepEqual: assert.deepEqual,
  });
}
