import type { FeedbackSubmission } from "@/types/sync";

export interface FeedbackEnv {
  DB: {
    prepare(query: string): {
      bind(...values: unknown[]): { run(): Promise<unknown> };
    };
  };
}

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  const responseHeaders = new Headers(init.headers);
  responseHeaders.set("content-type", "application/json; charset=utf-8");
  responseHeaders.set("access-control-allow-origin", "*");
  responseHeaders.set("access-control-allow-methods", "POST, OPTIONS");
  responseHeaders.set("access-control-allow-headers", "content-type");

  return new Response(JSON.stringify(body), {
    headers: responseHeaders,
    status: init.status ?? 200,
  });
}

export default {
  async fetch(request: Request, env: FeedbackEnv): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname !== "/api/feedback") {
      return jsonResponse({ error: "Not found" }, { status: 404 });
    }

    if (request.method === "OPTIONS") {
      return jsonResponse(null, { status: 204 });
    }

    if (request.method !== "POST") {
      return jsonResponse(
        { error: "Method not allowed" },
        { status: 405, headers: { Allow: "POST, OPTIONS" } },
      );
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
        `INSERT INTO feedback_messages (name, university, subject, message)
         VALUES (?1, ?2, ?3, ?4)`,
      )
        .bind(fullName, university, subject, context)
        .run();
      return jsonResponse({ success: true });
    } catch (error) {
      console.error("feedback insert failed", error);
      return jsonResponse({ error: "Database operation failed" }, { status: 500 });
    }
  },
};
