const assert = require('assert-diff');

module.exports = class StepManager {
  constructor(generator, args) {
    if (!generator) {
      throw new Error(`ExpectGen requires an generator, passed in ${generator}`);
    }

    this.generator = generator;
    this.args = args;
    this.steps = [];
  }

  yields(expectedValue, result, message = 'yields') {
    this.steps.push({
      expectedValue,
      result,
      message,
    });

    return this;
  }

  next(result, message = 'next') {
    this.steps.push({ result, message });
    return this;
  }

  finishes(expectedValue, message = 'finishes') {
    this.steps.push({
      expectedDone: true,
      expectedValue,
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

class Runner {
  constructor(it, steps) {
    this.it = it;
    this.steps = steps;
    this.results = [];
    this.isDone = false;
  }

  run() {
    const { it, steps } = this;

    steps.reduce((prevResult, step) => {
      if (this.isDone) throwExtraStep(step);

      const output = it.next(prevResult);

      if (step.expectedDone) {
        if (output.done !== true) throwExpectFinish(step);
      }

      if (step.expectedValue) {
        assert.deepEqual(output.value, step.expectedValue, step.message);
      }

      if (output.done) this.isDone = true;

      // TODO replace functions with a symbol containing its name
      const finalOutput = Object.assign({}, output, { message: step.message});
      this.results.push(finalOutput);

      return step.result;
    }, null);

    return this.results;
  }
}

const addMessage = (str, step) => {
  if (step.message) return `${step.message}: ${str}`;
  return str;
}

const throwExpectFinish = (step) => {
  throw new Error({
    message: addMessage(
      'Expected the generator to finish but it has more step(s) left.',
      step
    ),
  });
};

const throwExtraStep = (step) => {
  throw new Error({
    message: addMessage(
      'Too many steps were provided for the generator',
      step,
    ),
  });
};
