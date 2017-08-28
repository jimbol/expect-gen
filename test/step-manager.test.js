const { put } = require('redux-saga/effects');
const assert = require('assert-diff');
const StepManager = require('../step-manager');
const { deepEqual } = assert;
function startLoading(ids) {
  return {
    payload: ids,
    type: 'LOADING',
  };
}

function* myEffect(ids) {
  yield put(startLoading(ids));
}

function* myEffect2(ids) {
  const val = yield ids;
  return val;
}

describe('StepManager', () => {
  let args;
  let stepManager;
  let ids;

  beforeEach(() => {
    ids = [1, 2, 3];
    args = [ids];
    stepManager = new StepManager({
      generator: myEffect,
      args,
      deepEqual,
    });
  });

  it('stores args arguments', () => {
    expect(stepManager.args)
      .toBe(args);
  });

  it('stores generator arguments', () => {
    expect(stepManager.generator)
      .toBe(myEffect);
  });

  describe('#yields', () => {
    describe('when it will pass', () => {
      beforeEach(() => {
        yieldedVal = put(startLoading(ids));
        stepManager.yields(yieldedVal);
      });

      it('adds step with an expectedValue and a result', () => {
        expect(stepManager.steps.length).toEqual(1);
        expect(stepManager.steps[0].expectedValue).toBe(yieldedVal);
      });
    });

    describe('when it wont pass', () => {
      beforeEach(() => {
        yieldedVal = put(startLoading([]));
        stepManager.yields(yieldedVal);
      });

      it('throws on run', () => {
        expect(() => stepManager.run()).toThrow();
      });
    });
  });

  it('stores generator arguments', () => {
    expect(stepManager.generator)
      .toBe(myEffect);
  });

  describe('#next', () => {
    beforeEach(() => {
      ids = [1, 2, 3];
      args = [ids];
      stepManager = new StepManager({
        generator: myEffect2,
        args,
        deepEqual,
      })
        .next('123');
    });

    it('adds step with result but no expected value', () => {
      expect(stepManager.steps.length).toEqual(1);
      expect(stepManager.steps[0].result).toBe('123');
    });

    it('passes result into generator', () => {
      stepManager.finishes('123').run();
    });
  });

  describe('Errors', () => {
    const errEffect = function* (ids) {
      let val;
      try {
        yield ids;
      } catch (e) {
        yield 'CAUGHT';
      }

      return 'THE_END';
    };

    let myError;
    let myIds;

    beforeEach(() => {
      myIds = [1, 2, 3];
      args = [myIds];
      myError = new Error('My error');
    });

    describe('#catches', () => {
      beforeEach(() => {
        stepManager = new StepManager({
          generator: errEffect,
          args,
          deepEqual,
        })
          .next()
          .catches(myError, 'CAUGHT');
      });

      it('stores expectedValue', () => {
        expect(stepManager.steps.length).toEqual(2);
        expect(stepManager.steps[1].error).toBe(myError);
        expect(stepManager.steps[1].expectedValue).toBe('CAUGHT');
      });

      it('passes result into generator', () => {
        stepManager.finishes('THE_END').run();
      });
    });

    describe('#catchesAndFinishes', () => {
      const errFinishEffect = function* (ids) {
        let val;
        try {
          yield ids;
        } catch (e) {
          return 'CAUGHT';
        }

        return 'THE_END';
      };

      beforeEach(() => {
        stepManager = new StepManager({
          generator: errFinishEffect,
          args,
          deepEqual,
        })
          .next()
          .catchesAndFinishes(myError, 'CAUGHT');
      });

      it('stores expectedValue', () => {
        expect(stepManager.steps.length).toEqual(2);
        expect(stepManager.steps[1].error).toBe(myError);
        expect(stepManager.steps[1].expectedValue).toBe('CAUGHT');
      });

      it('passes result into generator', () => {
        stepManager.run();
      });
    });

    describe('#throws', () => {
      beforeEach(() => {
        stepManager = new StepManager({
          generator: myEffect,
          args,
          deepEqual,
        })
          .next()
          .throws(myError);
      });

      it('stores expectedValue', () => {
        expect(stepManager.steps.length).toEqual(2);
        expect(stepManager.steps[1].error).toBe(myError);
        expect(stepManager.steps[1].expectedThrow).toBe(true);
      });

      it('passes result into generator', () => {
        stepManager.run();
      });
    });
  });

  describe('#finishes', () => {
    beforeEach(() => {
      ids = [1, 2, 3];
      args = [ids];
      stepManager = new StepManager({
        generator: myEffect2,
        args,
        deepEqual,
      })
        .next('123')
        .finishes('123');
    });

    it('adds step with expectedValue and expectedDone', () => {
      expect(stepManager.steps.length).toEqual(2);
      expect(stepManager.steps[1].expectedValue).toBe('123');
    });

    it('fails assertion when generator not complete', () => {
      stepManager = new StepManager({
        generator: myEffect2,
        args,
        deepEqual,
      })
        .finishes('123');
      expect(() => stepManager.run()).toThrow();
    });
  });

  describe('when more steps are expected but generator is done', () => {
    it('throws', () => {
      stepManager = new StepManager({
        generator: myEffect2,
        args,
        deepEqual,
      })
        .next()
        .next()
        .next();

      expect(() => stepManager.run()).toThrowErrorMatchingSnapshot();
    });
  });
});
