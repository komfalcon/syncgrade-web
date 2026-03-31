import type { AcademicData, UserIdentity } from "@/types/sync";

export interface Env {
  DB: {
    prepare(query: string): {
      bind(...values: unknown[]): { run(): Promise<unknown> };
    };
  };
}

export interface StudentSyncPayload {
  user: {
    uuid: UserIdentity["uuid"];
    name: UserIdentity["name"];
  };
  data: {
    department: UserIdentity["department"];
    university: UserIdentity["university"];
    academic_data?: AcademicData;
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
      return jsonResponse(
        { error: "Method not allowed" },
        { status: 405, headers: { Allow: "POST" } },
      );
    }

    let payload: StudentSyncPayload;
    try {
      payload = (await request.json()) as StudentSyncPayload;
    } catch {
      return jsonResponse({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const uuid = payload?.user?.uuid?.trim();
    const name = payload?.user?.name?.trim();
    const department = payload?.data?.department?.trim();
    const university = payload?.data?.university?.trim();

    if (!uuid || !name || !department || !university) {
      return jsonResponse({ error: "Missing required user identity fields" }, { status: 400 });
    }

    const academicData = payload?.data?.academic_data ?? null;
    const lastSync = new Date().toISOString();

    try {
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
          academicData === null ? null : JSON.stringify(academicData),
        )
        .run();
    } catch (error) {
      console.error("students upsert failed", error);
      return jsonResponse({ error: "Database operation failed" }, { status: 500 });
    }

    return jsonResponse({ success: true, uuid, last_sync: lastSync });
  },
};
