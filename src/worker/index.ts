import feedbackWorker, { type FeedbackEnv } from "@/worker/feedbackWorker";
import studentSyncWorker, { type Env as StudentSyncEnv } from "@/worker/studentSyncWorker";

type WorkerEnv = FeedbackEnv & StudentSyncEnv;

const notFoundResponse = new Response(JSON.stringify({ error: "Not found" }), {
  status: 404,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
  },
});

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/feedback") {
      return feedbackWorker.fetch(request, env);
    }

    if (pathname === "/api/student-sync") {
      return studentSyncWorker.fetch(request, env);
    }

    return notFoundResponse;
  },
};
