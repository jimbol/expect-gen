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
      result,
      expectedValue,
    });

    return this;
  }

  catches(error, expectedValue) {
    this.steps.push({
      error,
      expectedValue,
    });

    return this;
  }

  throws(error) {
    this.steps.push({
      error,
      expectedThrow: true,
    });

    return this;
  }

  catchesAndFinishes(error, expectedValue) {
    this.steps.push({
      error,
      expectedValue,
      expectedDone: true,
    });

    return this;
  }

  next(result) {
    this.steps.push({ result });
    return this;
  }

  finishes(expectedValue) {
    this.steps.push({
      expectedValue,
      expectedDone: true,
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
      const output = runStep(it, step, prevResult);

      runAssertions(step, output);

      if (output.done) this.isDone = true;

      this.results.push(output);
      return step.result;
    }, null);

    return this.results;
  }
}

const runStep = (it, step, prevResult) => {
  if (step.error) {
    try {
      return it.throw(step.error);
    } catch (error) {
      return {
        errorThrown: error,
      };
    }
  }

  return it.next(prevResult);
}

const runAssertions = (step, output) => {
  if (step.expectedThrow) {
    assert.deepEqual(output.errorThrown, step.error);
  } else if (output.errorThrown) {
    throw output.errorThrown;
  }

  if (step.expectedDone) {
    assert.equal(output.done, true);
  }

  if (step.expectedValue) {
    assert.deepEqual(output.value, step.expectedValue);
  }
};

const throwExtraStep = (step) => {
  throw new Error({
    message: 'Too many steps were provided for the generator',
    failedOnStep: step,
  });
};
