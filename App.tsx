import React, { useCallback, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ListRenderItem,
  ActivityIndicator,
} from "react-native";
import { useGenerateData } from "./generateData";
import { Data } from "./models";
import { MyFlatList } from "./MyFlatList";

const keyExtractor = (item: Data) => item.workoutId;

const NORMAL_ROW_HEIGHT = 100;
const CURRENT_USER_ROW_HEIGHT = 110;

const viewabilityConfig = {
  itemVisiblePercentThreshold: 50,
};

export default function App() {
  const {
    fetchNext,
    fetchPrevious,
    currentUserIndex,
    isLoading,
    isLoadingNextPage,
    isLoadingPrevPage,
    data,
  } = useGenerateData(100);

  const flatListRef = useRef<MyFlatList<Data>>(null);

  const renderTopSpinnerWindow = useCallback(() => {
    if (true) {
      return (
        <View style={styles.loadingSpinnerWindow}>
          <ActivityIndicator />
        </View>
      );
    } else return null;
  }, [isLoadingPrevPage]);

  const renderBottomSpinnerWindow = useCallback(() => {
    if (true) {
      return (
        <View style={styles.loadingSpinnerWindow}>
          <ActivityIndicator />
        </View>
      );
    } else return null;
  }, [isLoadingNextPage]);

  const handleFetchPrevious = useCallback(() => {
    flatListRef.current?.maintainVisibleScrollPositionOnNextUpdate(true);
    fetchPrevious();
  }, [fetchPrevious, flatListRef]);

  const handleFetchNext = useCallback(() => {
    flatListRef.current?.maintainVisibleScrollPositionOnNextUpdate(true);
    fetchNext();
  }, [fetchNext, flatListRef]);

  const getItemLayout = useCallback(
    (_: Data[] | null | undefined, index: number) => {
      const offset =
        index > currentUserIndex
          ? NORMAL_ROW_HEIGHT * (index - 1) + CURRENT_USER_ROW_HEIGHT
          : NORMAL_ROW_HEIGHT * index;
      const length =
        index === currentUserIndex
          ? CURRENT_USER_ROW_HEIGHT
          : NORMAL_ROW_HEIGHT;
      return { offset, length, index };
    },
    [currentUserIndex]
  );

  return (
    <View style={styles.container}>
      {isLoading ? (
        <FullScreenLoadingSpinner />
      ) : (
        <MyFlatList<Data>
          data={data}
          ref={flatListRef}
          windowSize={2}
          renderItem={renderRow}
          removeClippedSubviews={true}
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          ListFooterComponent={renderBottomSpinnerWindow}
          ListHeaderComponent={renderTopSpinnerWindow}
          viewabilityConfig={viewabilityConfig}
          onEndReached={handleFetchNext}
          onBeginningReached={handleFetchPrevious}
          onBeginningReachedThreshold={0.2}
          onEndReachedThreshold={0.2}
        />
      )}
    </View>
  );
}

const renderRow: ListRenderItem<Data> = (info) =>
  info.item.isCurrentUser ? (
    <CurrentUserRow {...info.item} />
  ) : (
    <Row {...info.item} />
  );

const Row: React.FC<Data> = React.memo((props) => {
  // console.log(`R - ${props.workoutId}`);
  return (
    <View style={styles.row}>
      <View style={styles.rank}>
        <Text>{props.rank}</Text>
      </View>
      <View style={styles.username}>
        <Text>{props.username}</Text>
      </View>
    </View>
  );
});

const CurrentUserRow: React.FC<Data> = React.memo((props) => {
  // console.log(`R - ${props.workoutId}`);
  return (
    <View style={styles.currentUserRow}>
      <View style={styles.rank}>
        <Text>{props.rank}</Text>
      </View>
      <View style={styles.username}>
        <Text>{props.username}</Text>
      </View>
    </View>
  );
});

const FullScreenLoadingSpinner = () => {
  return (
    <View style={[StyleSheet.absoluteFill, styles.hCenter, styles.vCenter]}>
      <ActivityIndicator size="large" />
    </View>
  );
};

const styles = StyleSheet.create({
  hCenter: {
    alignItems: "center",
  },
  vCenter: {
    justifyContent: "center",
  },
  loadingSpinnerWindow: {
    height: 100,
    backgroundColor: "gray",
    width: "100%",
  },
  rank: {
    marginLeft: 5,
  },
  username: {
    marginRight: 10,
  },
  row: {
    height: 100,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  currentUserRow: {
    height: 110,
    backgroundColor: "red",
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  container: {
    backgroundColor: "#fff",
  },
});
