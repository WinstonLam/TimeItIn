import { useRef, useCallback, useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { isFunction } from "lodash";

type StateFunctionType<S> = Dispatch<SetStateAction<S>>;
export type SetStateCallbackGeneric<S> = (
  x: S | StateFunctionType<S>,
  cb?: (newState: S) => void
) => void;

const useStateCallback = <T,>(
  initialState: T
): [T, SetStateCallbackGeneric<T>] => {
  const [state, setState] = useState<T>(initialState);
  const cbRef = useRef<any>(null);

  const setStateCallback: SetStateCallbackGeneric<T> = useCallback(
    (newState, cb) => {
      cbRef.current = cb;
      setState(newState as any);
    },
    []
  );

  useEffect(() => {
    if (isFunction(cbRef?.current)) {
      // @ts-ignore
      cbRef?.current?.(state);
      cbRef.current = null;
    }
  }, [state]);

  return [state, setStateCallback];
};

export default useStateCallback;
