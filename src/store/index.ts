import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import projectsReducer from "./projectsSlice";
import tasksReducer from "./tasksSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    projects: projectsReducer,
    tasks: tasksReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
