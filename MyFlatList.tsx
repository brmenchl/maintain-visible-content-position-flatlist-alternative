import * as React from "react";
import {
  VirtualizedList,
  ListRenderItem,
  ViewStyle,
  ViewToken,
  VirtualizedListProps,
  ViewabilityConfigCallbackPair,
  ViewabilityConfigCallbackPairs,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";

// "Forked" from react-native@61.0.4

/** Making most keys that we use required just cuz
 * Ignored Props from FlatList:
 * - ItemSeparatorComponent?: React.ComponentType<any> | null;
 * - ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
 * - columnWrapperStyle?: StyleProp<ViewStyle>;
 * - keyboardShouldPersistTaps?: boolean | 'always' | 'never' | 'handled';
 * - extraData?: any; // extra data to tell list to rerender
 * - horizontal?: boolean | null;
 * - initialNumToRender?: number;
 * - initialScrollIndex?: number | null;
 * - legacyImplementation?: boolean;
 * - numColumns?: number;
 * - onRefresh?: (() => void) | null;
 * - refreshing?: boolean | null;
 */
type FlatListProps<ItemT> = {
  data: ReadonlyArray<ItemT> | null | undefined;
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListFooterComponentStyle?: ViewStyle | null;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListHeaderComponentStyle?: ViewStyle | null;
  getItemLayout?: (
    data: Array<ItemT> | null | undefined,
    index: number
  ) => { length: number; offset: number; index: number };
  keyExtractor: (item: ItemT, index: number) => string;
  onEndReached?: ((info: { distanceFromEnd: number }) => void) | null;
  onEndReachedThreshold: number | null;
  renderItem: ListRenderItem<ItemT>;
  removeClippedSubviews?: boolean;
};

type ExtraProps<ItemT> = {
  /**
   * Called once when the scroll position gets within onEndReachedThreshold of the rendered content.
   */
  onBeginningReached?:
    | ((info: { distanceFromBeginning: number }) => void)
    | null;

  /**
   * How far (in units of visible length of the list) the top edge of the
   * list must be from the top of the content to trigger the `onBeginningReached` callback.
   */
  onBeginningReachedThreshold?: number | null;
  /**
   * If scroll key search fails, the index in props.data to scroll to when maintaining scroll position
   * on data update.
   */
  fallbackScrollPositionIndex?: number;
  /**
   * same as key extractor, but provides an alternate key for maintaining scroll positions across data updates.
   */
  scrollKeyExtractor: (item: ItemT) => any;
};

export type MyFlatListProps<ItemT> = Omit<VirtualizedListProps<ItemT>, "data"> &
  FlatListProps<ItemT> &
  ExtraProps<ItemT>;

const defaultProps = {
  // Start VirtualizedList default props (for props I left optional)
  initialNumToRender: 10,
  maxToRenderPerBatch: 10,
  onEndReachedThreshold: 2, // multiples of length
  scrollEventThrottle: 50,
  updateCellsBatchingPeriod: 50,
  windowSize: 21, // multiples of length
  // End VirtualizedList default props
  removeClippedSubviews: true,
  onBeginningReachedThreshold: 2, // multiples of length
};

type DefaultProps = typeof defaultProps;

/*
 * This is a convenience wrapper around [`<VirtualizedList>`](docs/virtualizedlist.html),
 * and thus inherits its props (as well as those of `ScrollView`) that aren't explicitly listed here.
 * Also inherits [ScrollView Props](docs/scrollview.html#props), unless it is nested in another FlatList of same orientation.
 * DELETED:
 * - scrollToEnd (didnt use)
 * - scrollToItem (didnt use, nonperformant)
 * - all logic for horizontal and numColumns > 1
 * - recordInteraction
 * - ios-only stuff
 * - getScrollResponder
 * - getScrollableNode
 * - setNativeProps
 * - all invariant assertions because we don't wanna add another library
 *   - changing viewabilityConfig on the fly
 *   - changing onViewableItemsChanged on the fly
 *   - changing viewabilityConfigCallbackPairs on the fly
 *   - setting both onViewableItemsChanged and viewabilityConfigCallbackPairs
 *   - having a custom data type
 */
export class MyFlatList<ItemT> extends React.PureComponent<
  MyFlatListProps<ItemT>
> {
  static defaultProps: DefaultProps = defaultProps;

  private firstScrollKeyViewability: ViewabilityConfigCallbackPair = {
    viewabilityConfig: {
      itemVisiblePercentThreshold: 20,
    },
    onViewableItemsChanged: ({ viewableItems }) =>
      (this.firstScrollKey = viewableItems.length
        ? this.props.scrollKeyExtractor(viewableItems[0].item)
        : undefined),
  };
  private listRef = React.createRef<VirtualizedList<ItemT>>();
  private virtualizedListPairs: Array<ViewabilityConfigCallbackPair> = [];
  private shouldMaintainVisibleScrollPositionOnNextUpdate: boolean = false;
  private firstScrollKey: any | undefined;
  private canCallOnBeginningReached: boolean = false;
  private canCallOnEndReached: boolean = false;
  private scrollMetrics = {
    contentLength: 0,
    offset: 0,
    visibleLength: 0,
  };

  constructor(props: MyFlatListProps<ItemT>) {
    super(props);
    const {
      onViewableItemsChanged,
      viewabilityConfig,
      viewabilityConfigCallbackPairs,
    } = this.props;
    if (viewabilityConfigCallbackPairs) {
      this.virtualizedListPairs = this.cleanUpViewabilityConfigProps(
        viewabilityConfigCallbackPairs
      );
    } else {
      if (viewabilityConfig && onViewableItemsChanged) {
        this.virtualizedListPairs = this.cleanUpViewabilityConfigProps([
          {
            onViewableItemsChanged,
            viewabilityConfig,
          },
        ]);
      }
    }
    this.virtualizedListPairs.push(this.firstScrollKeyViewability);
  }

  public maintainVisibleScrollPositionOnNextUpdate(value: boolean) {
    this.shouldMaintainVisibleScrollPositionOnNextUpdate = value;
  }

  public scrollToIndex(params: {
    animated?: boolean;
    index: number;
    viewOffset?: number;
    viewPosition?: number;
  }) {
    if (this.listRef.current) {
      this.listRef.current.scrollToIndex(params);
    }
  }

  public scrollToOffset(params: { animated?: boolean; offset: number }) {
    if (this.listRef.current) {
      this.listRef.current.scrollToOffset(params);
      this.listRef.current.context;
    }
  }

  public componentDidUpdate(prevProps: MyFlatListProps<ItemT>) {
    // If previously set flag to maintain scroll position, and data has just changed
    if (
      this.shouldMaintainVisibleScrollPositionOnNextUpdate &&
      this.props.data !== prevProps.data
    ) {
      let scrollIndex: number | undefined;

      // Find the previous first visible scroll key, and scroll to the item with that scroll key
      if (this.firstScrollKey) {
        scrollIndex = this.props.data?.findIndex(
          (row) => this.props.scrollKeyExtractor(row) === this.firstScrollKey
        );
      }

      // Set scroll index to fallback if provided.
      if (scrollIndex === undefined || scrollIndex === -1) {
        scrollIndex = this.props.fallbackScrollPositionIndex;
      }

      // Corrective scroll
      if (scrollIndex !== undefined && scrollIndex > -1) {
        this.scrollToIndex({
          index: scrollIndex,
          animated: false,
        });
      }

      this.shouldMaintainVisibleScrollPositionOnNextUpdate = false;
    }
  }

  public render() {
    // Override VirtualizedList onEndReached functionality
    const {
      onEndReached,
      onEndReachedThreshold,
      viewabilityConfig,
      onViewableItemsChanged,
      ...props
    } = this.props;
    return (
      <VirtualizedList
        {...props}
        onScroll={this.onScroll}
        getItem={this.getItem}
        getItemCount={this.getItemCount}
        keyExtractor={this.props.keyExtractor}
        ref={this.listRef}
        viewabilityConfigCallbackPairs={this.virtualizedListPairs}
        renderItem={this.props.renderItem}
      />
    );
  }

  private cleanUpViewabilityConfigProps = (
    viewabilityConfigCallbackAsPairs: ViewabilityConfigCallbackPairs
  ) => {
    return viewabilityConfigCallbackAsPairs.map((pair) => ({
      viewabilityConfig: pair.viewabilityConfig,
      onViewableItemsChanged: (info: {
        viewableItems: Array<ViewToken>;
        changed: Array<ViewToken>;
      }) => {
        if (pair.onViewableItemsChanged) {
          pair.onViewableItemsChanged(info);
        }
      },
    }));
  };

  private getItem = (data: ItemT[], index: number) => {
    return data[index];
  };

  private getItemCount = (data?: Array<ItemT>): number => {
    return data ? Math.ceil(data.length) : 0;
  };

  private onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    this.updateScrollMetrics(e);
    this.maybeCallOnBeginningReached();
    this.maybeCallOnEndReached();
    this.props.onScroll?.(e);
  };

  private maybeCallOnBeginningReached = () => {
    const { onBeginningReached, onBeginningReachedThreshold } = this.props;
    const { offset, visibleLength, contentLength } = this.getScrollMetrics()!;

    if (!onBeginningReached || !contentLength) {
      return;
    }

    const threshold = (onBeginningReachedThreshold ?? 0) * visibleLength;

    if (
      onBeginningReached &&
      offset < threshold &&
      this.canCallOnBeginningReached
    ) {
      this.canCallOnBeginningReached = false;
      onBeginningReached({ distanceFromBeginning: offset });
    } else if (offset >= threshold) {
      // If the user scrolls away from the top and back again, cause
      // an onBeginningReached to be triggered again
      this.canCallOnBeginningReached = true;
    }
  };

  private maybeCallOnEndReached = () => {
    const { onEndReached, onEndReachedThreshold } = this.props;
    const { offset, visibleLength, contentLength } = this.getScrollMetrics()!;

    if (!onEndReached || !contentLength) {
      return;
    }

    const distanceFromEnd = contentLength - visibleLength - offset;
    const threshold = (onEndReachedThreshold ?? 0) * visibleLength;

    if (threshold && distanceFromEnd < threshold && this.canCallOnEndReached) {
      this.canCallOnEndReached = false;
      onEndReached({ distanceFromEnd });
    } else if (distanceFromEnd >= threshold) {
      // If the user scrolls away from the bottom and back again, cause
      // an onEndReached to be triggered again
      this.canCallOnEndReached = true;
    }
  };

  private updateScrollMetrics = (
    e: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    this.scrollMetrics = {
      visibleLength: e.nativeEvent.layoutMeasurement.height,
      contentLength: e.nativeEvent.contentSize.height,
      offset: e.nativeEvent.contentOffset.y,
    };
  };

  private getScrollMetrics = () => {
    // Basically this.listRef.current?.getChildContext().virtualizedList.getScrollMetrics();
    // but doesnt lag behind one scroll event
    return this.scrollMetrics;
  };
}
