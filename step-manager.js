const Runner = require('./runner');

module.exports = class StepManager {
  constructor(generator, args) {
    if (!generator) {
      throw new Error(`ExpectGen requires an generator, passed in ${generator}`);
    }

    this.generator = generator;
    this.args = args;
    this.steps = [];
  }

  yields(expectedValue, result) {
    this.steps.push({
      result,
      expectedValue,
      stack: getCallStack('yields'),
    });

    return this;
  }

  catches(error, expectedValue) {
    this.steps.push({
      error,
      expectedValue,
      stack: getCallStack('catches'),
    });

    return this;
  }

  throws(error) {
    this.steps.push({
      error,
      expectedThrow: true,
      stack: getCallStack('throws'),
    });

    return this;
  }

  catchesAndFinishes(error, expectedValue) {
    this.steps.push({
      error,
      expectedValue,
      expectedDone: true,
      stack: getCallStack('catchesAndFinishes'),
    });

    return this;
  }

  next(result) {
    this.steps.push({
      result,
      stack: getCallStack('next'),
    });
    return this;
  }

  finishes(expectedValue) {
    this.steps.push({
      expectedValue,
      expectedDone: true,
      stack: getCallStack('finishes'),
    });

    return this;
  }

  run(context = null) {
    const it = this.generator.apply(context, this.args);
    const runner = new Runner(it, this.steps);
    return runner.run();
  }

  toJSON(context = null) {
    return JSON.parse(JSON.stringify(this.run(context)));
  }
}

const getCallStack = (message) => {
  const err = new Error(message);
  if (!err || !err.stack) return message;

  const stack = err.stack
    .split('\n')
    .slice(2, 10)
    .join('\n');

  return stack;
}
