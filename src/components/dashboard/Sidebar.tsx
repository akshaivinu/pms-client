import Link from "next/link";
import type { Project, User } from "../../types/models";

type SidebarProps = {
  projects: Project[];
  selectedId: string;
  user: User | null;
  taskCount: number;
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
};

const itemId = (item: Project) => item._id ?? item.id ?? "";

export default function Sidebar({
  projects,
  selectedId,
  user,
  taskCount,
  onSelectProject,
  onCreateProject,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">P</span>
        <span>
          pms<span className="brand-dot">.</span>
        </span>
      </div>
      <div className="workspace-label">
        Workspace{" "}
        <button className="icon-button" aria-label="Workspace menu">
          ⌄
        </button>
      </div>
      <nav className="nav-list">
        <Link className="nav-item active" href="/">
          <span>◈</span> Overview
        </Link>
        <Link className="nav-item" href="/?view=tasks">
          <span>▣</span> My tasks <b>{taskCount}</b>
        </Link>
        <Link className="nav-item" href="/projects">
          <span>▤</span> Projects
        </Link>
        <Link className="nav-item" href="/activity">
          <span>⌁</span> Activity
        </Link>
      </nav>
      <div className="project-heading">
        <span>Projects</span>
        {user?.role !== "member" && (
          <button
            className="icon-button"
            onClick={onCreateProject}
            aria-label="Add project"
          >
            +
          </button>
        )}
      </div>
      <div className="project-list">
        {projects.map((project) => (
          <button
            className={`project-link ${itemId(project) === selectedId ? "selected" : ""}`}
            key={itemId(project)}
            onClick={() => onSelectProject(itemId(project))}
          >
            <i />
            {project.name}
          </button>
        ))}
      </div>
      <div className="sidebar-footer">
        <div className="avatar">
          {user?.name?.slice(0, 2).toUpperCase() ?? "?"}
        </div>
        <div>
          <strong>{user?.name ?? "Account"}</strong>
          <small>{user?.role ?? "Member"}</small>
        </div>
        <button className="icon-button">•••</button>
      </div>
    </aside>
  );
}
