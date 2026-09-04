import { store } from "../store";
import { clearUser } from "../store/authSlice";
import { clearProjects } from "../store/projectsSlice";
import { clearTasks } from "../store/tasksSlice";
import { api } from "./api";

export async function logout() {
  await api.auth.logout().catch(() => undefined);
  store.dispatch(clearUser());
  store.dispatch(clearProjects());
  store.dispatch(clearTasks());
}
