const { put } = require('redux-saga/effects');
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

describe('Snapshot test', () => {
  it('creates a snapshot', () => {
    const snapshot = expectGen(myEffect)
      .next()
      .finishes()
      .toJSON();

    expect(snapshot).toMatchSnapshot();
  });
});
