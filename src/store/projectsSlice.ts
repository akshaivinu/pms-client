import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Project } from "../types/models";

type ProjectsState = {
  items: Project[];
  selectedId: string;
};

const initialState: ProjectsState = { items: [], selectedId: "" };

const projectsSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    setProjects: (state, action: PayloadAction<Project[]>) => {
      state.items = action.payload;
      if (!state.selectedId && action.payload[0]) {
        state.selectedId = action.payload[0]._id ?? action.payload[0].id ?? "";
      }
    },
    addProject: (state, action: PayloadAction<Project>) => {
      state.items.push(action.payload);
      state.selectedId = action.payload._id ?? action.payload.id ?? "";
    },
    selectProject: (state, action: PayloadAction<string>) => {
      state.selectedId = action.payload;
    },
    clearProjects: () => initialState,
  },
});

export const { setProjects, addProject, selectProject, clearProjects } =
  projectsSlice.actions;
export default projectsSlice.reducer;
