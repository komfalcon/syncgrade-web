import type { FeedbackSubmission } from "@/types/sync";

export interface FeedbackEnv {
  DB: {
    prepare(query: string): {
      bind(...values: unknown[]): { run(): Promise<unknown> };
    };
  };
}

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers ?? {}),
    },
    status: init.status ?? 200,
  });
}

export default {
  async fetch(request: Request, env: FeedbackEnv): Promise<Response> {
    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, { status: 405, headers: { Allow: "POST" } });
    }

    let payload: FeedbackSubmission;
    try {
      payload = (await request.json()) as FeedbackSubmission;
    } catch {
      return jsonResponse({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const fullName = payload?.fullName?.trim();
    const university = payload?.university?.trim();
    const subject = payload?.subject?.trim();
    const context = payload?.context?.trim();
    if (!fullName || !university || !subject || !context) {
      return jsonResponse({ error: "Missing required fields" }, { status: 400 });
    }

    try {
      await env.DB.prepare(
        `INSERT INTO feedback_messages (full_name, university, subject, context, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5)`,
      )
        .bind(fullName, university, subject, context, new Date().toISOString())
        .run();
      return jsonResponse({ success: true });
    } catch (error) {
      console.error("feedback insert failed", error);
      return jsonResponse({ error: "Database operation failed" }, { status: 500 });
    }
  },
};
