const StepManager = require('./step-manager');

module.exports = function expectGen(iterator, ...args) {
  return new StepManager(iterator, args);
}
