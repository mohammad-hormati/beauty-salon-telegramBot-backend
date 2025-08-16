const userSelections: Record<number, any> = {};

export const getUserSession = (userId: number) => {
  if (!userSelections[userId]) {
    userSelections[userId] = {};
  }
  return userSelections[userId];
};

export const clearUserSession = (userId: number) => {
  delete userSelections[userId];
};