const { put } = require('redux-saga');
const assert = require('assert');
const expectGen = require('../index');
const StepManager = require('../step-manager');

function startLoading(ids) {
  return {
    payload: ids,
    type: 'LOADING',
  };
}

function* myEffect(ids, save) {
  const hash = yield put(startLoading(ids));
}

describe('#expectGen', () => {
  it('creates StepManager', () => {
    expect(expectGen(myEffect))
      .toBeInstanceOf(StepManager);
  });
});
