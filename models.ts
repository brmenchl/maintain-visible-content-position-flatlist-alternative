export type Data = {
  id: string;
  rank: number;
  otherData: number;
  username: string;
  isCurrentUser: boolean;
};

export const toRandomData = (idx: number): Data => ({
  id: `id-${idx}`,
  rank: idx,
  otherData: Math.round(idx * 10 + Math.random() * 10),
  username: `person-${idx}`,
  isCurrentUser: false,
});
