const { put } = require('redux-saga/effects');
const assert = require('assert-diff');
const StepManager = require('../step-manager');

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
    stepManager = new StepManager(myEffect, args);
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

      it('calls assert on run', () => {
        const assertSpy = spyOn(assert, 'deepEqual');

        stepManager.run();
        expect(assertSpy).toHaveBeenCalled();
      });
    });

    describe('when it wont pass', () => {
      beforeEach(() => {
        yieldedVal = put(startLoading([]));
        stepManager.yields(yieldedVal);
      });

      it('throws on run', () => {
        expect(() => stepManager.run()).toThrowErrorMatchingSnapshot();
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
      stepManager = new StepManager(myEffect2, args)
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
        stepManager = new StepManager(errEffect, args)
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
        stepManager = new StepManager(errFinishEffect, args)
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
        stepManager = new StepManager(myEffect, args)
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
      stepManager = new StepManager(myEffect2, args)
        .next('123')
        .finishes('123');
    });

    it('adds step with expectedValue and expectedDone', () => {
      expect(stepManager.steps.length).toEqual(2);
      expect(stepManager.steps[1].expectedValue).toBe('123');
    });

    it('fails assertion when generator not complete', () => {
      stepManager = new StepManager(myEffect2, args)
        .finishes('123');
      expect(() => stepManager.run()).toThrow();
    });
  });

  describe('when more steps are expected but generator is done', () => {
    it('throws', () => {
      stepManager = new StepManager(myEffect2, args)
        .next()
        .next()
        .next();
      expect(() => stepManager.run()).toThrow();
    });
  });
});
