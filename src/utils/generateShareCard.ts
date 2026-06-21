type DrawingContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

type SemesterInput = { id?: string; name: string };

type SemesterPoint = {
  name: string;
  shortName: string;
  gpa: number;
};

const CARD_SIZE = 1080;
const CARD_RADIUS = 48;
const SHARE_FILE_NAME = "syncgrade-cgpa-card.png";

const C = {
  bg0: "#09090b",
  bg1: "#111113",
  primary: "#a3e635",
  primaryAlpha: "rgba(163,230,53,0.15)",
  primaryGlow: "rgba(163,230,53,0.07)",
  success: "#4ade80",
  warning: "#facc15",
  cyan: "#22d3ee",
  text: "#fafafa",
  muted: "#a1a1aa",
  subtle: "#71717a",
  surface: "rgba(255,255,255,0.05)",
  border: "rgba(255,255,255,0.08)",
  borderMid: "rgba(255,255,255,0.12)",
};

function createCanvas(width: number, height: number): OffscreenCanvas | HTMLCanvasElement {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function is2DContext(
  context: RenderingContext | OffscreenRenderingContext | null,
): context is DrawingContext {
  return !!context && "fillText" in context;
}

async function canvasToBlob(canvas: OffscreenCanvas | HTMLCanvasElement): Promise<Blob> {
  if ("convertToBlob" in canvas) {
    return (canvas as OffscreenCanvas).convertToBlob({ type: "image/png" });
  }
  return new Promise<Blob>((resolve, reject) => {
    (canvas as HTMLCanvasElement).toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to generate image blob"));
        return;
      }
      resolve(blob);
    }, "image/png");
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

function formatSessionFromCurrentDate(): string {
  const currentYear = new Date().getFullYear();
  return `${currentYear}/${currentYear + 1}`;
}

function normalizeSessionLabel(session: string | null | undefined): string {
  const raw = session?.trim();
  if (!raw) return formatSessionFromCurrentDate();
  const match = raw.match(/^(\d{4})\s*\/\s*(\d{4})$/);
  if (!match) return raw;
  return `${match[1]}/${match[2]}`;
}

function firstName(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0] ?? "";
}

function levelFromSemesterCount(count: number): string {
  if (count <= 0) return "";
  const computed = Math.max(1, Math.ceil(count / 2)) * 100;
  return `${computed} Level`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundedRect(
  ctx: DrawingContext,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawWrappedText(
  ctx: DrawingContext,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 2,
): void {
  if (!text.trim()) return;
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = words[0] ?? "";
  for (let i = 1; i < words.length; i += 1) {
    const test = `${current} ${words[i]}`;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      lines.push(current);
      current = words[i] ?? "";
      if (lines.length === maxLines - 1) break;
    }
  }
  lines.push(current);
  if (lines.length > maxLines) lines.length = maxLines;
  if (lines.length === maxLines && words.length > 1) {
    const lastIndex = lines.length - 1;
    let line = lines[lastIndex] ?? "";
    while (line.length > 3 && ctx.measureText(`${line}…`).width > maxWidth) {
      line = line.slice(0, -1);
    }
    lines[lastIndex] = `${line}…`;
  }
  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });
}

function formatGpa(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
}

function abbreviateSemesterName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "—";
  if (trimmed.length <= 10) return trimmed;
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    const short = words.map((w) => w[0]?.toUpperCase() ?? "").join("");
    return short.slice(0, 4) || trimmed.slice(0, 10);
  }
  return `${trimmed.slice(0, 9)}…`;
}

function getClassificationColor(classification: string): string {
  const lower = classification.toLowerCase();
  if (lower.includes("first")) return C.success;
  if (lower.includes("upper")) return C.cyan;
  if (lower.includes("lower")) return C.warning;
  return "#fb923c";
}

function getAchievementText(classification: string, cgpa: number, scale: number): string {
  const isTopTier = (scale >= 5 && cgpa >= 4.5) || (scale <= 4 && cgpa >= 3.5);
  if (isTopTier) return `Top 5% of your department  ·  ${classification}`;
  return classification;
}

function getAcademicSessionLabel(admissionSession: string | null | undefined): string {
  return `${normalizeSessionLabel(admissionSession)} Session`;
}

function mapSemesterPoints(
  semesterGPAs: number[],
  semesters: SemesterInput[],
): SemesterPoint[] {
  if (semesterGPAs.length === 0) {
    return [{ name: "S1", shortName: "S1", gpa: 0 }];
  }
  return semesterGPAs.map((gpa, index) => {
    const source = semesters[index];
    const name = source?.name?.trim() || `Semester ${index + 1}`;
    return { name, shortName: abbreviateSemesterName(name), gpa };
  });
}

function drawBackground(ctx: DrawingContext): void {
  const bg = ctx.createLinearGradient(0, 0, 0, CARD_SIZE);
  bg.addColorStop(0, C.bg0);
  bg.addColorStop(1, C.bg1);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_SIZE, CARD_SIZE);

  // Subtle dot-grid texture
  ctx.fillStyle = "rgba(255,255,255,0.022)";
  const spacing = 44;
  for (let gx = spacing; gx < CARD_SIZE; gx += spacing) {
    for (let gy = spacing; gy < CARD_SIZE - 34; gy += spacing) {
      ctx.beginPath();
      ctx.arc(gx, gy, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Lime glow at top-center
  const glow = ctx.createRadialGradient(CARD_SIZE / 2, 0, 0, CARD_SIZE / 2, 0, 540);
  glow.addColorStop(0, C.primaryGlow);
  glow.addColorStop(1, "rgba(163,230,53,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CARD_SIZE, CARD_SIZE);
}

function drawDivider(ctx: DrawingContext, y: number): void {
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, y);
  ctx.lineTo(CARD_SIZE - 60, y);
  ctx.stroke();
}

function drawHeader(
  ctx: DrawingContext,
  sessionText: string,
  logoImg: HTMLImageElement | null,
): void {
  const topY = 44;
  const left = 60;
  const right = CARD_SIZE - 60;
  const logoSize = 48;

  if (logoImg) {
    ctx.drawImage(logoImg, left, topY, logoSize, logoSize);
  } else {
    // Minimal fallback lettermark
    roundedRect(ctx, left, topY, logoSize, logoSize, 10);
    ctx.fillStyle = "#1A237E";
    ctx.fill();
    ctx.fillStyle = C.primary;
    ctx.font = "700 28px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("S", left + logoSize / 2, topY + 34);
  }

  ctx.textAlign = "left";
  ctx.fillStyle = C.text;
  ctx.font = "700 30px Inter, sans-serif";
  ctx.fillText("SyncGrade", left + logoSize + 14, topY + 30);

  ctx.fillStyle = C.muted;
  ctx.font = "400 18px Inter, sans-serif";
  ctx.fillText("Academic Progress", left + logoSize + 14, topY + 54);

  // Session pill
  ctx.font = "500 17px Inter, sans-serif";
  const pillPadX = 18;
  const pillH = 36;
  const pillW = ctx.measureText(sessionText).width + pillPadX * 2;
  const pillX = right - pillW;
  const pillY = topY + 6;
  roundedRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fillStyle = C.surface;
  ctx.fill();
  ctx.strokeStyle = C.borderMid;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = C.text;
  ctx.textAlign = "center";
  ctx.fillText(sessionText, pillX + pillW / 2, pillY + pillH / 2 + 6);
}

function drawCgpaSection(
  ctx: DrawingContext,
  cgpa: number,
  scale: number,
  classification: string,
): number {
  const centerX = CARD_SIZE / 2;
  let y = 148;

  // Subtle glow behind number
  const glow = ctx.createRadialGradient(centerX, y + 60, 0, centerX, y + 60, 240);
  glow.addColorStop(0, "rgba(163,230,53,0.10)");
  glow.addColorStop(1, "rgba(163,230,53,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, y, CARD_SIZE, 220);

  // CGPA number — lime-to-green gradient
  const numGrad = ctx.createLinearGradient(centerX - 200, 0, centerX + 200, 0);
  numGrad.addColorStop(0, "#86efac");
  numGrad.addColorStop(1, C.primary);
  ctx.fillStyle = numGrad;
  ctx.textAlign = "center";
  ctx.font = "700 136px Inter, sans-serif";
  ctx.fillText(formatGpa(cgpa), centerX, y + 130);

  y += 148;
  ctx.fillStyle = C.muted;
  ctx.font = "400 22px Inter, sans-serif";
  ctx.fillText("Cumulative GPA", centerX, y);

  y += 28;
  const barW = CARD_SIZE * 0.8;
  const barH = 10;
  const barX = (CARD_SIZE - barW) / 2;
  roundedRect(ctx, barX, y, barW, barH, barH / 2);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fill();

  const fill = clamp((cgpa / Math.max(scale, 0.01)) * barW, 0, barW);
  if (fill > 0) {
    const fillGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    fillGrad.addColorStop(0, "#86efac");
    fillGrad.addColorStop(1, C.primary);
    roundedRect(ctx, barX, y, fill, barH, barH / 2);
    ctx.fillStyle = fillGrad;
    ctx.fill();
  }

  y += 28;
  const classColor = getClassificationColor(classification);
  ctx.textAlign = "right";
  ctx.fillStyle = classColor;
  ctx.font = "600 21px Inter, sans-serif";
  ctx.fillText(`${classification} ✓`, barX + barW, y);

  return y + 22;
}

function drawIdentitySection(
  ctx: DrawingContext,
  y: number,
  studentName: string,
  levelLabel: string,
  programme: string,
): number {
  const centerX = CARD_SIZE / 2;
  const name = firstName(studentName) || "Student";

  ctx.textAlign = "center";
  ctx.fillStyle = C.text;
  ctx.font = "700 52px Inter, sans-serif";
  ctx.fillText(name, centerX, y + 52);

  const details = [levelLabel, programme.trim()].filter(Boolean).join("  ·  ");
  ctx.fillStyle = C.primary;
  ctx.font = "500 24px Inter, sans-serif";
  if (details) {
    drawWrappedText(ctx, details, centerX, y + 86, 860, 30, 2);
  }

  return y + 110;
}

type StatCardInput = {
  label: string;
  value: string;
  sublabel: string;
  accent: string;
};

function drawStatCard(
  ctx: DrawingContext,
  x: number,
  y: number,
  w: number,
  h: number,
  data: StatCardInput,
): void {
  roundedRect(ctx, x, y, w, h, 14);
  ctx.fillStyle = C.surface;
  ctx.fill();
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Top accent bar
  roundedRect(ctx, x, y, w, 4, 4);
  ctx.fillStyle = data.accent;
  ctx.fill();

  ctx.textAlign = "left";
  ctx.fillStyle = C.muted;
  ctx.font = "500 16px Inter, sans-serif";
  ctx.fillText(data.label, x + 18, y + 32);

  ctx.fillStyle = C.text;
  ctx.font = "700 36px Inter, sans-serif";
  const valueFits = ctx.measureText(data.value).width <= w - 36;
  const displayValue = valueFits
    ? data.value
    : data.value.length > 14
      ? `${data.value.slice(0, 13)}…`
      : data.value;
  ctx.fillText(displayValue, x + 18, y + 76);

  ctx.fillStyle = C.muted;
  ctx.font = "400 15px Inter, sans-serif";
  drawWrappedText(ctx, data.sublabel, x + 18, y + 96, w - 36, 16, 1);
}

function drawStatsGrid(
  ctx: DrawingContext,
  y: number,
  values: {
    currentGpa: string;
    creditsEarned: string;
    creditsMeta: string;
    bestGpa: string;
    bestSemesterName: string;
    semestersProgress: string;
  },
): number {
  const totalWidth = CARD_SIZE * 0.87;
  const left = (CARD_SIZE - totalWidth) / 2;
  const gap = 12;
  const cardW = (totalWidth - gap) / 2;
  const cardH = 110;

  const cards: StatCardInput[] = [
    { label: "Current GPA", value: values.currentGpa, sublabel: "This Semester", accent: C.primary },
    { label: "Credits Earned", value: values.creditsEarned, sublabel: values.creditsMeta, accent: C.cyan },
    { label: "Best Semester", value: values.bestGpa, sublabel: values.bestSemesterName, accent: C.success },
    { label: "Semesters", value: values.semestersProgress, sublabel: "Completed", accent: C.warning },
  ];

  drawStatCard(ctx, left, y, cardW, cardH, cards[0]!);
  drawStatCard(ctx, left + cardW + gap, y, cardW, cardH, cards[1]!);
  drawStatCard(ctx, left, y + cardH + gap, cardW, cardH, cards[2]!);
  drawStatCard(ctx, left + cardW + gap, y + cardH + gap, cardW, cardH, cards[3]!);

  return y + cardH * 2 + gap;
}

function drawTrendGraph(
  ctx: DrawingContext,
  y: number,
  points: SemesterPoint[],
  scale: number,
): number {
  const graphWidth = CARD_SIZE * 0.87;
  const graphHeight = 100;
  const x = (CARD_SIZE - graphWidth) / 2;
  const axisY = y + graphHeight;

  // Card background (includes label area)
  roundedRect(ctx, x, y - 12, graphWidth, graphHeight + 50, 14);
  ctx.fillStyle = C.surface;
  ctx.fill();
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Top lime accent
  roundedRect(ctx, x, y - 12, graphWidth, 4, 4);
  ctx.fillStyle = C.primary;
  ctx.fill();

  const normalized = points.map((point, index) => {
    const px =
      points.length === 1
        ? x + graphWidth / 2
        : x + (index / (points.length - 1)) * graphWidth;
    const ratio = clamp(point.gpa / Math.max(scale, 0.1), 0, 1);
    const py = y + (1 - ratio) * (graphHeight - 14);
    return { ...point, x: px, y: py };
  });

  if (normalized.length > 1) {
    // Fill area
    ctx.beginPath();
    ctx.moveTo(normalized[0]!.x, axisY);
    normalized.forEach((point, index) => {
      if (index === 0) {
        ctx.lineTo(point.x, point.y);
      } else {
        const prev = normalized[index - 1]!;
        const mx = (prev.x + point.x) / 2;
        ctx.quadraticCurveTo(prev.x, prev.y, mx, (prev.y + point.y) / 2);
        ctx.quadraticCurveTo(mx, (prev.y + point.y) / 2, point.x, point.y);
      }
    });
    ctx.lineTo(normalized[normalized.length - 1]!.x, axisY);
    ctx.closePath();
    ctx.fillStyle = "rgba(163,230,53,0.12)";
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(normalized[0]!.x, normalized[0]!.y);
    normalized.forEach((point, index) => {
      if (index === 0) return;
      const prev = normalized[index - 1]!;
      const cx = (prev.x + point.x) / 2;
      const cy = (prev.y + point.y) / 2;
      ctx.quadraticCurveTo(prev.x, prev.y, cx, cy);
      ctx.quadraticCurveTo(cx, cy, point.x, point.y);
    });
    ctx.strokeStyle = C.primary;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    // Data point dots
    normalized.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = C.primary;
      ctx.fill();
    });
  } else {
    ctx.beginPath();
    ctx.arc(normalized[0]!.x, normalized[0]!.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = C.primary;
    ctx.fill();
  }

  ctx.fillStyle = C.muted;
  ctx.font = "400 16px Inter, sans-serif";
  ctx.textAlign = "center";
  normalized.forEach((point) => {
    ctx.fillText(point.shortName, point.x, axisY + 22);
  });

  return axisY + 32;
}

function drawBadgeAndFooter(ctx: DrawingContext, y: number, achievement: string): void {
  const centerX = CARD_SIZE / 2;
  const badgeW = 700;
  const badgeH = 52;
  const badgeX = centerX - badgeW / 2;
  const badgeY = y;

  roundedRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeH / 2);
  ctx.fillStyle = C.primaryAlpha;
  ctx.fill();
  ctx.strokeStyle = "rgba(163,230,53,0.3)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = C.primary;
  ctx.font = "600 21px Inter, sans-serif";
  drawWrappedText(ctx, achievement, centerX, badgeY + 34, badgeW - 32, 24, 1);

  ctx.fillStyle = C.subtle;
  ctx.font = "400 16px Inter, sans-serif";
  ctx.fillText(
    "Tracked with SyncGrade · syncgrade.aurikrex.tech",
    centerX,
    badgeY + badgeH + 34,
  );
}

function drawTicker(ctx: DrawingContext): void {
  const tickerH = 34;
  const y = CARD_SIZE - tickerH;
  ctx.fillStyle = C.primary;
  ctx.fillRect(0, y, CARD_SIZE, tickerH);

  ctx.textAlign = "left";
  ctx.fillStyle = "#09090b";
  ctx.font = "600 13px Inter, sans-serif";
  ctx.fillText(
    "SyncGrade   ·   SyncGrade   ·   SyncGrade   ·   SyncGrade   ·   SyncGrade   ·   SyncGrade   ·   SyncGrade",
    20,
    y + 22,
  );
}

function findBestSemester(points: SemesterPoint[]): { gpa: string; name: string } {
  if (!points.length) return { gpa: "0.00", name: "No semesters yet" };
  const best = points.reduce(
    (prev, curr) => (curr.gpa > prev.gpa ? curr : prev),
    points[0]!,
  );
  return { gpa: formatGpa(best.gpa), name: best.name || "Semester" };
}

function drawShareCard(
  ctx: DrawingContext,
  logoImg: HTMLImageElement | null,
  data: {
    cgpa: number;
    classification: string;
    totalCredits: number;
    studentName: string;
    programme: string;
    semesterGPAs: number[];
    scale: number;
    semesters: SemesterInput[];
    admissionSession?: string | null;
  },
): void {
  const {
    cgpa,
    classification,
    totalCredits,
    studentName,
    programme,
    semesterGPAs,
    scale,
    semesters,
    admissionSession,
  } = data;

  ctx.clearRect(0, 0, CARD_SIZE, CARD_SIZE);

  ctx.save();
  roundedRect(ctx, 0, 0, CARD_SIZE, CARD_SIZE, CARD_RADIUS);
  ctx.clip();

  drawBackground(ctx);

  drawHeader(ctx, getAcademicSessionLabel(admissionSession), logoImg);
  drawDivider(ctx, 128);

  const cgpaBottom = drawCgpaSection(ctx, cgpa, scale, classification);
  drawDivider(ctx, cgpaBottom + 4);

  const levelLabel = levelFromSemesterCount(semesters.length);
  const identityBottom = drawIdentitySection(
    ctx,
    cgpaBottom + 16,
    studentName,
    levelLabel,
    programme,
  );

  const points = mapSemesterPoints(semesterGPAs, semesters);
  const currentGpa =
    semesterGPAs.length > 0 ? formatGpa(semesterGPAs[semesterGPAs.length - 1] ?? 0) : "0.00";
  const best = findBestSemester(points);
  const completedSemesters = semesters.length;
  const totalSemesters = completedSemesters > 0 ? Math.ceil(completedSemesters / 2) * 2 : 0;

  const statsBottom = drawStatsGrid(ctx, identityBottom + 8, {
    currentGpa,
    creditsEarned: `${Math.round(totalCredits)}`,
    creditsMeta: "Credits Earned",
    bestGpa: best.gpa,
    bestSemesterName: best.name,
    semestersProgress: `${completedSemesters} of ${totalSemesters}`,
  });

  const graphBottom = drawTrendGraph(ctx, statsBottom + 10, points, scale);
  drawBadgeAndFooter(ctx, graphBottom + 8, getAchievementText(classification, cgpa, scale));
  drawTicker(ctx);

  ctx.restore();
}

export async function generateShareCard(
  cgpa: number,
  classification: string,
  totalCredits: number,
  studentName: string,
  programme: string,
  semesterGPAs: number[],
  scale: number,
  semesters: SemesterInput[],
  admissionSession?: string | null,
): Promise<File> {
  const canvas = createCanvas(CARD_SIZE, CARD_SIZE);
  const ctx = canvas.getContext("2d");
  if (!is2DContext(ctx)) {
    throw new Error("Canvas context not available");
  }

  let logoImg: HTMLImageElement | null = null;
  try {
    logoImg = await loadImage("/icons/syncgrade-icon.svg");
  } catch {
    // draw without logo — fallback lettermark will be used
  }

  drawShareCard(ctx, logoImg, {
    cgpa,
    classification,
    totalCredits,
    studentName,
    programme,
    semesterGPAs,
    scale,
    semesters,
    admissionSession,
  });

  const blob = await canvasToBlob(canvas);
  return new File([blob], SHARE_FILE_NAME, { type: "image/png" });
}
