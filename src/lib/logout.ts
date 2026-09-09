import { store } from "../store";
import { clearUser } from "../store/authSlice";
import { clearProjects } from "../store/projectsSlice";
import { clearTasks } from "../store/tasksSlice";
import { api, clearAuth } from "./api";

export async function logout() {
  await api.auth.logout().catch(() => undefined);
  clearAuth();
  store.dispatch(clearUser());
  store.dispatch(clearProjects());
  store.dispatch(clearTasks());
}
