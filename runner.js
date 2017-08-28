module.exports = class Runner {
  constructor(it, steps, deepEqual) {
    this.it = it;
    this.steps = steps;
    this.deepEqual = deepEqual;
    this.results = [];
    this.isDone = false;
  }

  run() {
    const { it, steps } = this;

    steps.reduce((prevResult, step) => {
      if (this.isDone) throwExtraStep(step);

      let output;
      try {
        output = runStep(it, step, prevResult);
        runAssertions(step, output, this.deepEqual);
      } catch (err) {
        err.stack = `${err.message}\n${step.stack}`;
        throw err;
      }

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

const runAssertions = (step, output, deepEqual) => {
  if (step.expectedThrow) {
    deepEqual(output.errorThrown, step.error);
  } else if (output.errorThrown) {
    throw output.errorThrown;
  }

  if (step.expectedDone) {
    if (output.done !== true) throwExpectFinish(step);
  }

  if (step.expectedValue) {
    deepEqual(output.value, step.expectedValue);
  }
};

const throwExpectFinish = () => {
  throw new Error('Expected the generator to finish but it has more step(s) left.');
};

const throwExtraStep = () => {
  throw new Error('Too many steps were provided for the generator');
};
