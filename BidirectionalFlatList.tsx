import * as React from "react";
import {
  FlatListProps,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { createRef } from "react";
import { isNil } from "ramda";

type Props<ItemT> = FlatListProps<ItemT> & {
  /**
   * Called once when the scroll position gets within onEndReachedThreshold of the rendered content.
   */
  onBeginningReached?:
    | ((info: { distanceFromBeginning: number }) => void)
    | null;

  /**
   * How far (in units of visible length of the list) the top edge of the
   * list must be from the top of the content to trigger the `onBeginningReached` callback.
   * Thus a value of 0.5 will trigger `onBeginningReached` when the top of the content is
   * within half the visible length of the list.
   */
  onBeginningReachedThreshold?: number | null;
  itemsPerWindow?: number;
};

export class BidirectionalFlatList<ItemT> extends React.Component<
  Props<ItemT>
> {
  private flatListRef: React.RefObject<FlatList<ItemT>> = createRef<
    FlatList<ItemT>
  >();
  private hasCalledOnBeginningReached = false;
  private firstVisibleIndex: number | null = 0;
  private firstKey: string | undefined;
  private windowHeight: number = 0;
  private shouldMaintainVisibleScrollPositionOnNextUpdate: boolean = false;

  private onLayout: FlatListProps<ItemT>["onLayout"] = (event) => {
    this.windowHeight = event.nativeEvent.layout.height;
    console.log(event)
  };

  private onScroll: FlatListProps<ItemT>["onScroll"] = (event) => {
    this.maybeCallOnBeginningReached(event);
    this.props.onScroll?.(event);
  };

  private onViewableItemsChanged: FlatListProps<
    ItemT
  >["onViewableItemsChanged"] = (info) => {
    const firstItem = info.viewableItems[0];
    this.firstVisibleIndex = firstItem?.index;
    this.firstKey = firstItem?.item
      ? this.props.keyExtractor?.(firstItem.item, 0)
      : undefined;
  };

  private maybeCallOnBeginningReached = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const { onBeginningReached, onBeginningReachedThreshold } = this.props;
    const { contentOffset } = event.nativeEvent; // get scroll offset
    const threshold = !isNil(onBeginningReachedThreshold)
      ? onBeginningReachedThreshold * this.windowHeight
      : 0;
    if (
      onBeginningReached &&
      this.firstVisibleIndex === 0 &&
      contentOffset.y < threshold &&
      !this.hasCalledOnBeginningReached
    ) {
      this.hasCalledOnBeginningReached = true;
      onBeginningReached({ distanceFromBeginning: contentOffset.y });
    } else if (contentOffset.y > threshold) {
      // If the user scrolls away from the top and back again cause
      // an onBeginningReached to be triggered again
      this.hasCalledOnBeginningReached = false;
    }
  };
  // TODO: probably throttle onEndReached, then idk

  private getScrollIndex(data: ItemT[]) {
    if (this.props.itemsPerWindow) {
      // next page (contentSize/2 - windowSize)
      // prev page (contentSize/2 + windowSize)
      // check if this bottoms out on edges
    }
  }

  componentDidUpdate(prevProps: Props<ItemT>) {
    // find prev top row
    if (
      this.shouldMaintainVisibleScrollPositionOnNextUpdate &&
      this.props.data !== prevProps.data
    ) {

      if (this.firstKey) {
        const updatedIndex = this.props.data?.findIndex(
          (row, index) => this.props.keyExtractor!(row, index) === this.firstKey
        );
        if (updatedIndex !== undefined && updatedIndex > -1) {
          this.flatListRef.current?.scrollToIndex({
            index: updatedIndex,
            animated: false,
          });
        }
      }
      this.shouldMaintainVisibleScrollPositionOnNextUpdate = false;
    }
  }

  public maintainVisibleScrollPositionOnNextUpdate(value: boolean) {
    this.shouldMaintainVisibleScrollPositionOnNextUpdate = value;
  }

  render() {
    const {
      onBeginningReached,
      onBeginningReachedThreshold,
      ...flatListProps
    } = this.props;

    return (
      <FlatList
        {...flatListProps}
        onScroll={this.onScroll}
        onLayout={this.onLayout}
        onViewableItemsChanged={this.onViewableItemsChanged}
        ref={this.flatListRef}
      />
    );
  }
}
