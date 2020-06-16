import { useState, useLayoutEffect } from "react";

export const useStateWithImmediateCallback = <T>(
  initialState: T,
  callback: (state: T) => void
) => {
  const [state, setState] = useState(initialState);

  useLayoutEffect(() => callback(state), [state, callback]);

  return [state, setState];
};
