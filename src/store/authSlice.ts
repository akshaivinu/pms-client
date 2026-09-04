import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { User } from "../types/models";

type AuthState = {
  user: User | null;
  checked: boolean;
};

const initialState: AuthState = { user: null, checked: false };

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.checked = true;
    },
    clearUser: (state) => {
      state.user = null;
      state.checked = true;
    },
  },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;
