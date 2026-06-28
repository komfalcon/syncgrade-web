import feedbackWorker, { type FeedbackEnv } from "@/worker/feedbackWorker";
import studentSyncWorker from "@/worker/studentSyncWorker";

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const { pathname } = new URL(request.url);

    // 1. Handle CORS Preflight (The Browser's "Ask Permission" Step)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "https://syncgrade.aurikrex.tech", // BE SPECIFIC
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // 2. Add CORS headers to ALL your actual responses
    const corsHeaders = {
      "Access-Control-Allow-Origin": "https://syncgrade.aurikrex.tech",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Content-Type": "application/json",
    };

    const dbEnv = { ...env, DB: env.DB || env.syncgrade };

    if (pathname === "/api/feedback") {
      const response = await feedbackWorker.fetch(request, dbEnv);
      // Clone the response to add CORS headers if the worker doesn't have them
      return new Response(response.body, { ...response, headers: { ...response.headers, ...corsHeaders } });
    }

    if (pathname === "/api/student-sync" || pathname === "/api/student-sync/restore") {
      const response = await studentSyncWorker.fetch(request, dbEnv);
      return new Response(response.body, { ...response, headers: { ...response.headers, ...corsHeaders } });
    }

    return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: corsHeaders });
  },
};