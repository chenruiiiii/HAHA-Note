type Procedure = (...args: readonly unknown[]) => void;

export type DebouncedFunction<T extends Procedure> = ((
  ...args: Parameters<T>
) => void) & {
  cancel: () => void;
  flush: (...args: Parameters<T>) => void;
};

export const debounce = <T extends Procedure>(
  fn: T,
  wait = 800
): DebouncedFunction<T> => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let latestArgs: Parameters<T> | null = null;

  const debounced = ((...args: Parameters<T>) => {
    latestArgs = args;

    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      timer = null;
      if (latestArgs) {
        fn(...latestArgs);
      }
    }, wait);
  }) as DebouncedFunction<T>;

  debounced.cancel = () => {
    if (!timer) return;
    clearTimeout(timer);
    timer = null;
  };

  debounced.flush = (...args: Parameters<T>) => {
    debounced.cancel();
    fn(...args);
  };

  return debounced;
};
