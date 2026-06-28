import type { AcademicData, UserIdentity } from "@/types/sync";

export interface Env {
  DB: {
    prepare(query: string): {
      bind(...values: unknown[]): {
        run(): Promise<unknown>;
        first<T = unknown>(): Promise<T | null>;
      };
    };
  };
  JWT_SECRET?: string;
}

export interface StudentSyncPayload {
  user: {
    uuid: UserIdentity["uuid"];
    name: UserIdentity["name"];
  };
  password?: string;
  force?: boolean;
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

// SHA-256 password hashing helper
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// HS256 JWT Generation Helper using native Web Crypto API
async function generateJWT(uuid: string, secret: string): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    sub: uuid,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365, // 1 year expiry
  };

  const encodedHeader = btoa(JSON.stringify(header))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const encodedPayload = btoa(JSON.stringify(payload))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const message = `${encodedHeader}.${encodedPayload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  return `${message}.${encodedSignature}`;
}

// HS256 JWT Verification Helper using native Web Crypto API
async function verifyJWT(token: string, secret: string): Promise<string | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const message = `${encodedHeader}.${encodedPayload}`;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    // Decode signature
    const sigString = atob(encodedSignature.replace(/-/g, "+").replace(/_/g, "/"));
    const sigBuffer = new Uint8Array(sigString.length);
    for (let i = 0; i < sigString.length; i++) {
      sigBuffer[i] = sigString.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBuffer,
      encoder.encode(message)
    );

    if (!isValid) return null;

    // Decode payload
    const payloadStr = atob(encodedPayload.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadStr);

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }

    return payload.sub; // Return the uuid (subject)
  } catch {
    return null;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const secret = env.JWT_SECRET || "syncgrade-default-jwt-secret-key-change-me";

    // Auto-migration: ensure password_hash column exists
    try {
      await env.DB.prepare("ALTER TABLE students ADD COLUMN password_hash TEXT").run();
    } catch (e) {
      // Column already exists, safe to ignore
    }

    const { pathname } = new URL(request.url);

    // Handle RESTORE flow
    if (pathname === "/api/student-sync/restore") {
      if (request.method !== "POST") {
        return jsonResponse({ error: "Method not allowed" }, { status: 405, headers: { Allow: "POST" } });
      }

      let payload: { uuid?: string; password?: string };
      try {
        payload = (await request.json()) as any;
      } catch {
        return jsonResponse({ error: "Invalid JSON payload" }, { status: 400 });
      }

      const uuid = payload.uuid?.trim();
      const password = payload.password?.trim();

      if (!uuid || !password) {
        return jsonResponse({ error: "Missing uuid or password" }, { status: 400 });
      }

      try {
        const student = await env.DB.prepare("SELECT * FROM students WHERE uuid = ?1")
          .bind(uuid)
          .first<any>();

        if (!student) {
          return jsonResponse({ error: "Sync identity not found" }, { status: 404 });
        }

        const inputHash = await hashPassword(password);
        if (student.password_hash && student.password_hash !== inputHash) {
          return jsonResponse({ error: "Incorrect password" }, { status: 401 });
        }

        const token = await generateJWT(uuid, secret);
        return jsonResponse({
          success: true,
          token,
          student: {
            uuid: student.uuid,
            name: student.name,
            department: student.department,
            university: student.university,
            last_sync: student.last_sync,
            academic_data: student.academic_data ? JSON.parse(student.academic_data) : null
          }
        });
      } catch (error) {
        console.error("students restore failed", error);
        return jsonResponse({ error: "Database operation failed" }, { status: 500 });
      }
    }

    // Default POST sync flow
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
      // Check if student already exists
      const existing = await env.DB.prepare("SELECT password_hash, academic_data FROM students WHERE uuid = ?1")
        .bind(uuid)
        .first<any>();

      let token: string | undefined;

      if (existing) {
        // Authenticate request using JWT or Password
        let authenticated = false;
        const authHeader = request.headers.get("Authorization");
        
        if (authHeader && authHeader.startsWith("Bearer ")) {
          const jwtToken = authHeader.substring(7);
          const jwtUuid = await verifyJWT(jwtToken, secret);
          if (jwtUuid === uuid) {
            authenticated = true;
          }
        }

        if (!authenticated && payload.password) {
          const inputHash = await hashPassword(payload.password);
          if (existing.password_hash === inputHash) {
            authenticated = true;
            // Renew/Issue JWT
            token = await generateJWT(uuid, secret);
          }
        }

        if (!authenticated) {
          return jsonResponse({ error: "Unauthorized access: Invalid token or password" }, { status: 401 });
        }

        // Overwrite Prevention: verify semester counts
        if (existing.academic_data && academicData && !payload.force) {
          try {
            const oldData = JSON.parse(existing.academic_data);
            const incomingData = academicData;
            
            const oldSems = Array.isArray(oldData.semesters) ? oldData.semesters.length : 0;
            const incomingSems = Array.isArray(incomingData.semesters) ? incomingData.semesters.length : 0;

            if (incomingSems < oldSems) {
              return jsonResponse({
                error: "Cloud backup contains more semesters than local payload. Overwrite prevented.",
                code: "OVERWRITE_PREVENTED"
              }, { status: 409 });
            }
          } catch (e) {
            // Safe to ignore JSON parse errors of old malformed data
          }
        }
      } else {
        // New Registration: Require a password
        if (!payload.password || payload.password.trim().length < 6) {
          return jsonResponse({ error: "Password is required for new sync identities (min 6 characters)" }, { status: 400 });
        }
        token = await generateJWT(uuid, secret);
      }

      // Hash the password if it's sent (registration or credential change)
      const passwordHash = payload.password ? await hashPassword(payload.password) : null;

      if (passwordHash) {
        await env.DB.prepare(
          `INSERT INTO students (uuid, name, department, university, last_sync, academic_data, password_hash)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
           ON CONFLICT(uuid) DO UPDATE SET
             name = excluded.name,
             department = excluded.department,
             university = excluded.university,
             last_sync = excluded.last_sync,
             academic_data = excluded.academic_data,
             password_hash = excluded.password_hash`,
        )
          .bind(
            uuid,
            name,
            department,
            university,
            lastSync,
            academicData === null ? null : JSON.stringify(academicData),
            passwordHash,
          )
          .run();
      } else {
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
      }

      return jsonResponse({ success: true, uuid, last_sync: lastSync, ...(token ? { token } : {}) });
    } catch (error) {
      console.error("students upsert failed", error);
      return jsonResponse({ error: "Database operation failed" }, { status: 500 });
    }
  },
};
