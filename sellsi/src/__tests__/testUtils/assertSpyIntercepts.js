export async function assertSpyIntercepts(spy, fn) {
  // Run the function and ensure the spy was called at least once.
  // We avoid forcing thrown markers because the SUT may intentionally handle some errors.
  spy.mockClear()
  try {
    await fn()
  } catch (err) {
    // If function errored, it's ok as long as spy was called
  }

  if (!spy.mock || spy.mock.calls.length === 0) {
    throw new Error('ASSERT_SPY_INTERCEPT_FAILED')
  }
}
