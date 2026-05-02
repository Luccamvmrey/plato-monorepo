export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { retries?: number; baseDelayMs?: number } = {}
): Promise<T> {
  const retries     = options.retries     ?? 3
  const baseDelayMs = options.baseDelayMs ?? 2000

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      if (attempt === retries) throw err
      await new Promise((res) =>
        setTimeout(res, baseDelayMs * Math.pow(2, attempt))
      )
    }
  }
  throw new Error('unreachable')
}
