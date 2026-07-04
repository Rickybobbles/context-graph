import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { db, audit, type Task } from "../db.js";

function formatTask(t: Task): string {
  const parts = [`#${t.id} ${t.title}`];
  if (t.owner) parts.push(`owner: ${t.owner}`);
  if (t.due) parts.push(`due: ${t.due}`);
  if (t.context_trigger) parts.push(`trigger: ${t.context_trigger}`);
  return parts.join(" — ");
}

/** Task tools, bound to the family member the current turn is acting for. */
export function taskTools(actor: string) {
  const taskCreate = betaZodTool({
    name: "task_create",
    description:
      "Create a task on the shared family task list. Call this whenever a family member " +
      "mentions something that needs doing. Give the task a clear, atomic title. Set owner " +
      "only when it is stated or obvious. Set context_trigger when the task should fire on " +
      "a situation rather than a time (e.g. 'when Rich is out near a supermarket').",
    inputSchema: z.object({
      title: z.string().describe("Short imperative description, e.g. 'Buy milk'"),
      owner: z.string().optional().describe("Family member responsible, if known"),
      due: z.string().optional().describe("Due date/time (ISO) or window ('this weekend')"),
      context_trigger: z
        .string()
        .optional()
        .describe("Situation that should surface this task, if time-based due doesn't fit"),
    }),
    run: ({ title, owner, due, context_trigger }) => {
      const info = db
        .prepare(
          "INSERT INTO tasks (title, owner, due, context_trigger, created_by) VALUES (?, ?, ?, ?, ?)",
        )
        .run(title, owner ?? null, due ?? null, context_trigger ?? null, actor);
      audit(actor, "task_create", `#${info.lastInsertRowid} ${title}`);
      return `Created task #${info.lastInsertRowid}: ${title}`;
    },
  });

  const taskList = betaZodTool({
    name: "task_list",
    description:
      "List open tasks on the shared family task list, optionally filtered by owner.",
    inputSchema: z.object({
      owner: z.string().optional().describe("Only tasks owned by this family member"),
    }),
    run: ({ owner }) => {
      const rows = (
        owner
          ? db
              .prepare("SELECT * FROM tasks WHERE status = 'open' AND owner = ? ORDER BY id")
              .all(owner)
          : db.prepare("SELECT * FROM tasks WHERE status = 'open' ORDER BY id").all()
      ) as Task[];
      if (rows.length === 0) return "No open tasks.";
      return rows.map(formatTask).join("\n");
    },
  });

  const taskComplete = betaZodTool({
    name: "task_complete",
    description: "Mark a task as done by its numeric id.",
    inputSchema: z.object({
      id: z.number().describe("Task id, e.g. 3 for task #3"),
    }),
    run: ({ id }) => {
      const info = db
        .prepare(
          "UPDATE tasks SET status = 'done', completed_at = datetime('now') WHERE id = ? AND status = 'open'",
        )
        .run(id);
      if (info.changes === 0) return `No open task #${id} found.`;
      audit(actor, "task_complete", `#${id}`);
      return `Task #${id} marked done.`;
    },
  });

  return [taskCreate, taskList, taskComplete];
}
