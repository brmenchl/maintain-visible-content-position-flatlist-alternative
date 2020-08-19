import { useInterval } from "./useInterval";
import { useCallback, useReducer } from "react";
import { times, slice } from "ramda";
import { toRandomData, Data } from "./models";

/**
 * This is a really bad generator
 * but it works
 */

const FETCH_INTERVAL = 3500;

const startTime = new Date();

const fullListData = times((idx) => toRandomData(idx), 1000);

const windowD = (offset: number) => {
  const { data, currentUserIndex } = swapOnTimer(fullListData);
  return {
    data: slice(offset - 50, offset + 51, data),
    currentUserIndex,
  };
};

type State = {
  isLoading: boolean;
  data: Data[];
  lastCurrentUserChangeTime: Date;
  currentUserIndex: number;
  offset: {
    isLoadingPrev: boolean;
    isLoadingNext: boolean;
    value: number;
  };
};

const fetchNextPage = () => ({
  type: "fetch next page" as const,
});

const fetchPreviousPage = () => ({
  type: "fetch previous page" as const,
});

const fetchComplete = () => ({
  type: "fetch complete" as const,
});

const fetchPageComplete = () => ({
  type: "fetch page complete" as const,
});

const updateData = () => ({
  type: "update data" as const,
});

type A = ReturnType<
  | typeof fetchNextPage
  | typeof fetchPreviousPage
  | typeof updateData
  | typeof fetchComplete
  | typeof fetchPageComplete
>;

function reducer(state: State, action: A): State {
  switch (action.type) {
    case "fetch next page":
      console.log(state.offset.isLoadingNext);
      if (state.offset.isLoadingNext) {
        return state;
      }
      return {
        ...state,
        offset: {
          ...state.offset,
          isLoadingNext: true,
          value: Math.min(950, state.offset.value + 50),
        },
      };
    case "fetch previous page":
      if (state.offset.isLoadingPrev) {
        return state;
      }
      return {
        ...state,
        offset: {
          ...state.offset,
          isLoadingPrev: true,
          value: Math.max(50, state.offset.value - 50),
        },
      };
    case "update data":
      const { data, currentUserIndex } = windowD(state.offset.value);
      // console.log(`======== UPDATE ======== ${state.data[0]?.rank}-${state.offset.value}-${state.data[state.data.length - 1]?.rank}`);
      return {
        ...state,
        isLoading: false,
        data,
        currentUserIndex,
      };
    case "fetch complete": {
      return {
        ...state,
        isLoading: false,
      };
    }
    case "fetch page complete":
      return {
        ...state,
        offset: {
          ...state.offset,
          isLoadingPrev: false,
          isLoadingNext: false,
        },
      };
    default:
      throw new Error();
  }
}

export const useGenerateData = (size: number) => {
  const firstPage = windowD(0);
  const [state, dispatch] = useReducer(reducer, {
    isLoading: true,
    data: firstPage.data,
    lastCurrentUserChangeTime: new Date(),
    currentUserIndex: firstPage.currentUserIndex,
    offset: {
      isLoadingNext: false,
      isLoadingPrev: false,
      value: 50,
    },
  });

  const refreshData = useCallback(() => {
    dispatch(updateData());
  }, [dispatch, updateData]);

  useInterval(refreshData, FETCH_INTERVAL);

  const fetchNext = useCallback(() => {
    console.log("fetch next");
    dispatch(fetchNextPage());
    setTimeout(() => {
      dispatch(fetchPageComplete());
    }, 1000);
  }, [dispatch, fetchNextPage, fetchPageComplete]);

  const fetchPrevious = useCallback(() => {
    console.log("fetch previous");
    dispatch(fetchPreviousPage());
    setTimeout(() => {
      dispatch(fetchPageComplete());
    }, 1000);
  }, [dispatch, fetchPreviousPage, fetchPageComplete]);

  return {
    ...state,
    fetchNext,
    fetchPrevious,
    isLoadingNextPage: state.offset.isLoadingNext,
    isLoadingPrevPage: state.offset.isLoadingPrev,
  };
};

const notCurrentUser: Data = {
  username: "frank",
  rank: 3,
  otherData: 100,
  id: "FRANK",
  isCurrentUser: false,
};
const currentUser: Data = {
  username: "ME!",
  rank: 4,
  otherData: 100,
  id: "ME",
  isCurrentUser: true,
};

const swapOnTimer = (data: Data[]) => {
  const now = new Date();
  const swapped =
    Math.round((now.valueOf() - startTime.valueOf()) / 5000) % 2 === 0;

  const newData = [...data];

  if (swapped) {
    newData[2] = { ...currentUser, rank: 2 };
    newData[3] = { ...notCurrentUser, rank: 3 };
    return {
      data: newData,
      currentUserIndex: 2,
    };
  } else {
    newData[2] = { ...notCurrentUser, rank: 2 };
    newData[3] = { ...currentUser, rank: 3 };
    return {
      data: newData,
      currentUserIndex: 3,
    };
  }
};
