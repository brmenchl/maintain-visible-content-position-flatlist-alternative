export type Data = {
  workoutId: string;
  rank: number;
  totalWork: number;
  username: string;
  isCurrentUser: boolean;
};

export const toRandomRankData = (idx: number): Data => ({
  workoutId: `workout-id-${idx}`,
  rank: idx,
  totalWork: Math.round(idx * 10 + Math.random() * 10),
  username: `person-${idx}`,
  isCurrentUser: false,
});
