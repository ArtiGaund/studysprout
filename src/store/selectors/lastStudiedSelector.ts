import { RootState } from "../store";

export const selectLastStudied = (state: RootState) => state.lastStudied.data;