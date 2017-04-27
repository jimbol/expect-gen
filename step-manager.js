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

  yields(expectedValue, result) {
    this.steps.push({
      expectedValue,
      result,
    });

    return this;
  }

  next(result) {
    this.steps.push({ result });
    return this;
  }

  finishes(expectedValue) {
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
        assert.equal(output.done, true);
      }

      if (step.expectedValue) {
        assert.deepEqual(output.value, step.expectedValue);
      }

      if (output.done) this.isDone = true;

      this.results.push(output);
      return step.result;
    }, null);

    return this.results;
  }
}

const throwExtraStep = (step) => {
  throw new Error({
    message: 'Too many steps were provided for the generator',
    failedOnStep: step,
  });
};
