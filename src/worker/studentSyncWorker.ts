export interface Env {
  DB: {
    prepare(query: string): {
      bind(...values: unknown[]): { run(): Promise<unknown> };
    };
  };
}

export interface StudentSyncPayload {
  user: {
    uuid: string;
    name: string;
  };
  data: {
    department?: string;
    university?: string;
    academic_data?: unknown;
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
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, { status: 405 });
    }

    let payload: StudentSyncPayload;
    try {
      payload = (await request.json()) as StudentSyncPayload;
    } catch {
      return jsonResponse({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const uuid = payload?.user?.uuid?.trim();
    const name = payload?.user?.name?.trim();
    if (!uuid || !name) {
      return jsonResponse({ error: "Missing required user identity fields" }, { status: 400 });
    }

    const department = payload?.data?.department ?? null;
    const university = payload?.data?.university ?? null;
    const academicData = payload?.data?.academic_data ?? null;
    const lastSync = new Date().toISOString();

    await env.DB.prepare(
      `INSERT INTO students (uuid, name, department, university, last_sync, academic_data)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6)
       ON CONFLICT(uuid) DO UPDATE SET
         name = excluded.name,
         department = excluded.department,
         university = excluded.university,
         last_sync = excluded.last_sync,
         academic_data = excluded.academic_data`,
    )
      .bind(
        uuid,
        name,
        department,
        university,
        lastSync,
        JSON.stringify(academicData),
      )
      .run();

    return jsonResponse({ success: true, uuid, last_sync: lastSync });
  },
};
