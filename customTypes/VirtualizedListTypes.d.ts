import "react-native";
declare module "react-native" {
  // Added to an upcoming type release, this was missing before https://github.com/DefinitelyTyped/DefinitelyTyped/pull/44462/files
  // Plus other stuff
  export class VirtualizedList<ItemT> extends React.Component<
    VirtualizedListProps<ItemT>
  > {
    scrollToEnd: (params?: { animated?: boolean }) => void;
    scrollToIndex: (params: {
      animated?: boolean;
      index: number;
      viewOffset?: number;
      viewPosition?: number;
    }) => void;
    scrollToItem: (params: {
      animated?: boolean;
      item: ItemT;
      viewPosition?: number;
    }) => void;

    scrollToOffset: (params: { animated?: boolean; offset: number }) => void;

    recordInteraction: () => void;

    // https://reactnative.dev/docs/virtualizedlist#getchildcontext
    getChildContext: () => {
      virtualizedList: VirtualizedListContext;
    };
  }

  export type Frame = {
    offset: number;
    length: number;
    index: number;
    inLayout: boolean;
  };

  export type ChildListState = {
    first: number;
    last: number;
    frames: { [key: number]: Frame };
  };
  export type ScrollMetrics = {
    contentLength: number;
    dOffset: number;
    dt: number;
    offset: number;
    timestamp: number;
    velocity: number;
    visibleLength: number;
  };

  export type VirtualizedListContext = {
    getScrollMetrics: () => ScrollMetrics;
    horizontal: boolean | null;
    getOutermostParentListRef: VirtualizedList;
    getNestedChildState: (
      key: string
    ) => { ref: VirtualizedList; state: ChildListState };
    registerAsNestedChild: (
      cellKey: string,
      key: string,
      ref: VirtualizedList
    ) => ChildListState;
    unregisterAsNestedChild: (key: striing, state: ChildListState) => void;
  };
}
