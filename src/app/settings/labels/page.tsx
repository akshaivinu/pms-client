"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, unwrap } from "../../../lib/api";

type Label = { _id?: string; id?: string; name?: string };

export default function LabelsPage() {
  const [labels, setLabels] = useState<Label[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("Loading labels...");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [editName, setEditName] = useState("");

  useEffect(() => {
    api.labels
      .list()
      .then((result) => {
        setLabels(unwrap(result, []) as Label[]);
        setMessage("");
      })
      .catch(() => setMessage("Could not load labels."));
  }, []);

  async function createLabel(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const result = await api.labels.create(name.trim());
      const created = unwrap(result, null) as Label | null;
      if (created) setLabels((current) => [...current, created]);
      setName("");
      setMessage("Label created.");
    } catch (reason) {
      setMessage(
        reason instanceof Error ? reason.message : "Could not create label.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateLabel(labelId: string) {
    if (!editName.trim()) return;
    try {
      await api.labels.update(labelId, { name: editName.trim() });
      setLabels((current) =>
        current.map((l) =>
          l._id === labelId || l.id === labelId
            ? { ...l, name: editName.trim() }
            : l,
        ),
      );
      setEditingId("");
      setEditName("");
      setMessage("Label updated.");
    } catch (reason) {
      setMessage(
        reason instanceof Error ? reason.message : "Could not update label.",
      );
    }
  }

  async function deleteLabel(labelId: string) {
    if (!window.confirm("Delete this label?")) return;
    try {
      await api.labels.delete(labelId);
      setLabels((current) =>
        current.filter((l) => l._id !== labelId && l.id !== labelId),
      );
      setMessage("Label deleted.");
    } catch (reason) {
      setMessage(
        reason instanceof Error ? reason.message : "Could not delete label.",
      );
    }
  }

  return (
    <main className="simple-page">
      <header className="simple-header">
        <Link href="/" className="brand">
          <span className="brand-mark">P</span>
          <span>
            pms<span className="brand-dot">.</span>
          </span>
        </Link>
        <nav>
          <Link href="/">Overview</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/activity">Activity</Link>
          <Link className="current" href="/settings">
            Settings
          </Link>
        </nav>
        <Link className="outline-button" href="/settings">
          Back to settings
        </Link>
      </header>
      <section className="simple-content narrow">
        <p className="eyebrow">Workspace</p>
        <h1>Labels</h1>
        <p className="lead">
          Create labels to categorize tasks across your projects.
        </p>
        {message && <p className="empty-state">{message}</p>}

        <form
          className="inline-form"
          onSubmit={createLabel}
          style={{ marginBottom: "24px" }}
        >
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Label name (e.g. Bug, Feature)"
            disabled={saving}
          />
          <button
            className="primary-button"
            type="submit"
            disabled={saving || !name.trim()}
          >
            Create label
          </button>
        </form>

        <div className="detail-list">
          {labels.map((label) => {
            const labelId = String(label._id ?? label.id ?? "");
            return (
              <article
                key={labelId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 0",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                {editingId === labelId ? (
                  <form
                    className="inline-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      updateLabel(labelId);
                    }}
                    style={{ flex: 1, display: "flex", gap: "8px" }}
                  >
                    <input
                      autoFocus
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button className="text-button" type="submit">
                      Save
                    </button>
                    <button
                      className="text-button"
                      type="button"
                      onClick={() => setEditingId("")}
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <strong>{label.name ?? "Untitled"}</strong>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <button
                        className="text-button"
                        type="button"
                        onClick={() => {
                          setEditingId(labelId);
                          setEditName(String(label.name ?? ""));
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="text-button"
                        type="button"
                        style={{ color: "var(--coral, #e53e3e)" }}
                        onClick={() => deleteLabel(labelId)}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </article>
            );
          })}
          {labels.length === 0 && !message && (
            <p className="empty-state">No labels yet. Create one above.</p>
          )}
        </div>
      </section>
    </main>
  );
}
