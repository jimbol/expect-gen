# Expect Gen
As in "expect generator...". An assertion / snapshot library for testing [iterators and generators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_Generators).  It was designed for, and works particularly well with, [redux-saga](https://github.com/redux-saga/redux-saga) but can be used for anything that uses generators.

## Example
```es6
function* myEffect(fakeAction) {
  const fooIds = yield select(fooIds);
  yield put(foosLoading());
  const results = yield call(apiFetch, options);
}

import expectGen from 'expect-gen';

it('runs effect with fakeFooIds and fakeResults', () => {
  expectGen(myEffect, fakeAction)
    // asserts step yields first `select(fooIds)`
    .yields(
      select(fooIds),
      // `fakeFooIds` gets pass into the following `next`
      fakeFooIds
    )
    .yields(
      put(foosLoading())
    )
    .yields(
      call(apiFetch, options),
      fakeResults
    )
    .finishes()
    .run();
});

it('runs effect with fakeFooIds and fakeResults', () => {
  const snapshot = expectGen(myEffect, fakeAction)
    // Doesn't run assertion for `next`
    .next(fakeFooIds)
    .next()
    .yields(
      call(apiFetch, options),
      fakeResults
    )
    .finishes()
    .toJSON();

  expect(snapshot).toMatchSnapshot();
});
```


# API
## expectGen
`expectGen(generator, [...args])`
- Calls the first argument with the rest of the arguments
- Returns instance of `StepManager`

## StepManager
`expectGen` returns an instance `StepManager`.  It gives us a set of chainable methods:

### yields
```es6
expectGen(generator, [...args])
  .yields(expectedValue, [result])
```
- Runs an assertion that iterator will yield the `expectedValue`
- Passes `result` into generator's `next` method
- Returns same instance `StepManager`

### next
```es6
expectGen(generator, [...args])
  .next([result])
```
- Passes `result` into generator's `next` method
- Makes no assertion
- Returns same instance `StepManager`

### throws
```es6
expectGen(generator, [...args])
  .throws(error)
```
- Throws `error` into generator
- Checks that iterator throws an uncaught exception
- Returns same instance `StepManager`

### catches
```es6
expectGen(generator, [...args])
  .catches(error, [expectedValue])
```
- Throws `error` into generator
- Runs an assertion that thrown iterator will yield the `expectedValue`
- Returns same instance `StepManager`

### catchesAndFinishes
```es6
expectGen(generator, [...args])
  .catchesAndFinishes(error, [result])
```
- Throws `error` into generator
- Asserts that generator finishes with `result`
- Returns same instance `StepManager`

### finishes
```es6
expectGen(generator, [...args])
  ...
  .finishes([result])
```
- Asserts that generator finishes with `result`
- Returns same instance `StepManager`

### run
```es6
expectGen(generator, [...args])
  ...
  .run()
```
- Executes all assertions
- Returns results of all generator steps as an array

### toJSON
```es6
expectGen(generator, [...args])
  ...
  .toJSON()
```
- Convert results from `run()` into a JSON object

## Roadmap
Expect Gen is heading towards v1. The following items still need to go in before then. Please open issues for other v1 requirements you find.

### v1.0.0
- [ ] [Allow custom assertion libraries](https://github.com/jimbol/expect-gen/issues/7)
- [ ] [Allow annotations to be added to assertions](https://github.com/jimbol/expect-gen/issues/1)
- [ ] [Add `assert` method](https://github.com/jimbol/expect-gen/issues/20)


## Previous Version
Expect Gen is a second generation version of [generator-test-runner](https://github.com/jimbol/generator-test-runner).  Many of the concepts used here originated there.
