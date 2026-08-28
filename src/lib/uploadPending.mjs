/**
 * Upload the files a form held while its task did not yet exist.
 *
 * DocumentManager can only send a file to the server once there is a task to
 * hang it on. For a new task it keeps the real File object and marks the entry
 * `pending`; this flushes those once the task has an id, and returns the
 * document list with the pending entries replaced by stored ones.
 */
export async function uploadPendingDocuments(documents, taskId) {
  const list = Array.isArray(documents) ? documents : [];
  if (!taskId || !list.some((d) => d?.pending)) return list;

  const out = [];
  for (const doc of list) {
    if (!doc?.pending || !doc.file) {
      out.push(doc);
      continue;
    }
    try {
      const body = new FormData();
      body.append("file", doc.file);
      body.append("task_id", taskId);
      const res = await fetch("/api/files", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Could not upload ${doc.name}`);
      out.push(data.document);
    } catch (error) {
      console.error("attachment upload failed:", error);
      /* Keep the task; just report the file that did not make it. */
      if (typeof window !== "undefined") window.alert(error.message);
    }
  }
  return out;
}
