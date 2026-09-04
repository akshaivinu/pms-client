import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Task } from "../types/models";

type TasksState = {
  items: Task[];
  byProject: Record<string, Task[]>;
};

const initialState: TasksState = { items: [], byProject: {} };

const tasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    setProjectTasks: (state, action: PayloadAction<{ projectId: string; tasks: Task[] }>) => {
      state.byProject[action.payload.projectId] = action.payload.tasks;
      state.items = action.payload.tasks;
    },
    addTask: (state, action: PayloadAction<{ projectId: string; task: Task }>) => {
      const current = state.byProject[action.payload.projectId] ?? [];
      state.byProject[action.payload.projectId] = [...current, action.payload.task];
      state.items = state.byProject[action.payload.projectId];
    },
  },
});

export const { setProjectTasks, addTask } = tasksSlice.actions;
export default tasksSlice.reducer;
