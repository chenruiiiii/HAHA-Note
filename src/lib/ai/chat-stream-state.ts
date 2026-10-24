export type TerminalStreamStatus = 'success' | 'error' | 'aborted' | null;

export type ReadyTransition = 'ignore' | 'complete' | 'preserve-terminal';
export type ErrorTransition = 'finalize' | 'defer-retry';

export function resolveReadyTransition(input: {
  activeRequest: boolean;
  retryPending: boolean;
  terminalStatus: TerminalStreamStatus;
}): ReadyTransition {
  if (!input.activeRequest || input.retryPending) {
    return 'ignore';
  }

  return input.terminalStatus === null ? 'complete' : 'preserve-terminal';
}

export function resolveErrorTransition(input: { retryPending: boolean }): ErrorTransition {
  return input.retryPending ? 'defer-retry' : 'finalize';
}
