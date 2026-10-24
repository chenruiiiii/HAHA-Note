import { describe, expect, it } from 'vitest';
import { resolveErrorTransition, resolveReadyTransition } from './chat-stream-state';

describe('resolveReadyTransition', () => {
  it('completes an active request that has no terminal state', () => {
    expect(
      resolveReadyTransition({
        activeRequest: true,
        retryPending: false,
        terminalStatus: null,
      })
    ).toBe('complete');
  });

  it('preserves an error recorded before the SDK becomes ready', () => {
    expect(
      resolveReadyTransition({
        activeRequest: true,
        retryPending: false,
        terminalStatus: 'error',
      })
    ).toBe('preserve-terminal');
  });

  it('preserves an aborted terminal state', () => {
    expect(
      resolveReadyTransition({
        activeRequest: true,
        retryPending: false,
        terminalStatus: 'aborted',
      })
    ).toBe('preserve-terminal');
  });

  it('ignores ready while an automatic retry is pending', () => {
    expect(
      resolveReadyTransition({
        activeRequest: true,
        retryPending: true,
        terminalStatus: null,
      })
    ).toBe('ignore');
  });

  it('ignores ready when there is no active request', () => {
    expect(
      resolveReadyTransition({
        activeRequest: false,
        retryPending: false,
        terminalStatus: null,
      })
    ).toBe('ignore');
  });
});

describe('resolveErrorTransition', () => {
  it('finalizes an error when no automatic retry is pending', () => {
    expect(resolveErrorTransition({ retryPending: false })).toBe('finalize');
  });

  it('defers the error state while an automatic retry is pending', () => {
    expect(resolveErrorTransition({ retryPending: true })).toBe('defer-retry');
  });
});
