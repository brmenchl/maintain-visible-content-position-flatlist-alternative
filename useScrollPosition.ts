import { useRef, useCallback } from "react";
import {
  NativeSyntheticEvent,
  NativeScrollEvent,
  NativeScrollPoint,
} from "react-native";

type OnScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => void;

export const useContentOffset = () => {
  const contentOffset = useRef<NativeScrollPoint>();

  const onScroll: OnScroll = useCallback(
    (event) => {
      contentOffset.current = event.nativeEvent.contentOffset;
    },
    [contentOffset]
  );

  return {
    onScroll,
    contentOffset,
  };
};
