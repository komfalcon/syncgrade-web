type DrawingContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

type SemesterInput = { id?: string; name: string };

type SemesterPoint = {
  name: string;
  shortName: string;
  gpa: number;
};

const CARD_SIZE = 1080;
const CARD_RADIUS = 40;
const SHARE_FILE_NAME = "syncgrade-cgpa-card.png";

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

function roundedRect(ctx: DrawingContext, x: number, y: number, w: number, h: number, r: number): void {
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
      current = words[i];
      if (lines.length === maxLines - 1) break;
    }
  }
  lines.push(current);
  if (lines.length > maxLines) lines.length = maxLines;
  if (lines.length === maxLines && words.length > 1) {
    const lastIndex = lines.length - 1;
    let line = lines[lastIndex];
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

function getAchievementText(classification: string, cgpa: number, scale: number): string {
  const isTopTier = (scale >= 5 && cgpa >= 4.5) || (scale <= 4 && cgpa >= 3.5);
  if (isTopTier) return "Top 5% of your department 🎓";
  return `${classification} 📊`;
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
    return {
      name,
      shortName: abbreviateSemesterName(name),
      gpa,
    };
  });
}

function drawHeader(ctx: DrawingContext, sessionText: string): void {
  const topPadding = 58;
  const left = 86;
  const right = CARD_SIZE - 86;

  const iconX = left + 12;
  const iconY = topPadding + 10;
  ctx.save();
  ctx.strokeStyle = "#6366f1";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(iconX, iconY, 16, 0.35 * Math.PI, 1.95 * Math.PI);
  ctx.stroke();
  ctx.fillStyle = "#6366f1";
  ctx.beginPath();
  ctx.moveTo(iconX + 15, iconY - 20);
  ctx.lineTo(iconX + 28, iconY - 14);
  ctx.lineTo(iconX + 17, iconY - 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 32px Poppins, sans-serif";
  ctx.fillText("SyncGrade", left + 42, topPadding + 24);
  ctx.fillStyle = "rgba(203,213,225,0.95)";
  ctx.font = "400 20px Poppins, sans-serif";
  ctx.fillText("Academic Progress", left + 42, topPadding + 56);

  ctx.font = "500 18px Poppins, sans-serif";
  const pillPadX = 16;
  const pillPadY = 9;
  const textWidth = ctx.measureText(sessionText).width;
  const pillW = textWidth + pillPadX * 2;
  const pillH = 38;
  const pillX = right - pillW;
  const pillY = topPadding + 10;
  roundedRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText(sessionText, pillX + pillW / 2, pillY + pillH / 2 + pillPadY / 2);
}

function drawCgpaSection(
  ctx: DrawingContext,
  cgpa: number,
  scale: number,
  classification: string,
): number {
  const centerX = CARD_SIZE / 2;
  let y = 238;

  const cgpaGradient = ctx.createLinearGradient(centerX - 250, y, centerX + 250, y);
  cgpaGradient.addColorStop(0, "#60a5fa");
  cgpaGradient.addColorStop(1, "#a78bfa");
  ctx.fillStyle = cgpaGradient;
  ctx.textAlign = "center";
  ctx.font = "700 150px Poppins, sans-serif";
  ctx.fillText(formatGpa(cgpa), centerX, y);

  y += 48;
  ctx.fillStyle = "#ffffff";
  ctx.font = "400 24px Poppins, sans-serif";
  ctx.fillText("Cumulative GPA", centerX, y);

  y += 30;
  const progressWidth = CARD_SIZE * 0.8;
  const progressHeight = 12;
  const progressX = (CARD_SIZE - progressWidth) / 2;
  const progressY = y;
  roundedRect(ctx, progressX, progressY, progressWidth, progressHeight, progressHeight / 2);
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.fill();

  const fill = clamp((cgpa / scale) * progressWidth, 0, progressWidth);
  if (fill > 0) {
    const fillGradient = ctx.createLinearGradient(progressX, 0, progressX + progressWidth, 0);
    fillGradient.addColorStop(0, "#60a5fa");
    fillGradient.addColorStop(1, "#a78bfa");
    roundedRect(ctx, progressX, progressY, fill, progressHeight, progressHeight / 2);
    ctx.fillStyle = fillGradient;
    ctx.fill();
  }

  ctx.textAlign = "right";
  ctx.fillStyle = "#22c55e";
  ctx.font = "500 22px Poppins, sans-serif";
  ctx.fillText(`${classification} ✓`, progressX + progressWidth, progressY + 36);

  return progressY + 48;
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
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 52px Poppins, sans-serif";
  ctx.fillText(name, centerX, y + 48);

  const details = [levelLabel, programme.trim()].filter(Boolean).join(" · ");
  ctx.fillStyle = "#818cf8";
  ctx.font = "500 26px Poppins, sans-serif";
  if (details) {
    drawWrappedText(ctx, details, centerX, y + 88, 820, 30, 2);
  }

  return y + 108;
}

type StatCardInput = {
  label: string;
  value: string;
  sublabel: string;
  accent: string;
};

function drawStatCard(ctx: DrawingContext, x: number, y: number, w: number, h: number, data: StatCardInput): void {
  roundedRect(ctx, x, y, w, h, 16);
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  ctx.stroke();

  roundedRect(ctx, x, y, w, 6, 6);
  ctx.fillStyle = data.accent;
  ctx.fill();

  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(148,163,184,0.95)";
  ctx.font = "500 18px Poppins, sans-serif";
  ctx.fillText(data.label, x + 18, y + 36);

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 38px Poppins, sans-serif";
  const valueFits = ctx.measureText(data.value).width <= w - 36;
  if (valueFits) {
    ctx.fillText(data.value, x + 18, y + 84);
  } else {
    const reduced = data.value.length > 14 ? `${data.value.slice(0, 13)}…` : data.value;
    ctx.fillText(reduced, x + 18, y + 84);
  }

  ctx.fillStyle = "rgba(148,163,184,0.9)";
  ctx.font = "400 16px Poppins, sans-serif";
  drawWrappedText(ctx, data.sublabel, x + 18, y + 104, w - 36, 16, 1);
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
  const totalWidth = CARD_SIZE * 0.86;
  const left = (CARD_SIZE - totalWidth) / 2;
  const gap = totalWidth * 0.03;
  const cardW = (totalWidth - gap) / 2;
  const cardH = 120;

  const cards: StatCardInput[] = [
    {
      label: "Current GPA",
      value: values.currentGpa,
      sublabel: "This Semester",
      accent: "#6366f1",
    },
    {
      label: "Credits Earned",
      value: values.creditsEarned,
      sublabel: values.creditsMeta,
      accent: "#a78bfa",
    },
    {
      label: "Best Semester",
      value: values.bestGpa,
      sublabel: values.bestSemesterName,
      accent: "#22c55e",
    },
    {
      label: "Semesters",
      value: values.semestersProgress,
      sublabel: "Completed",
      accent: "#f59e0b",
    },
  ];

  drawStatCard(ctx, left, y, cardW, cardH, cards[0]);
  drawStatCard(ctx, left + cardW + gap, y, cardW, cardH, cards[1]);
  drawStatCard(ctx, left, y + cardH + 12, cardW, cardH, cards[2]);
  drawStatCard(ctx, left + cardW + gap, y + cardH + 12, cardW, cardH, cards[3]);

  return y + cardH * 2 + 12;
}

function drawTrendGraph(ctx: DrawingContext, y: number, points: SemesterPoint[], scale: number): number {
  const graphWidth = CARD_SIZE * 0.86;
  const graphHeight = 120;
  const x = (CARD_SIZE - graphWidth) / 2;
  const axisY = y + graphHeight;

  const normalized = points.map((point, index) => {
    const px = points.length === 1 ? x + graphWidth / 2 : x + (index / (points.length - 1)) * graphWidth;
    const ratio = clamp(point.gpa / Math.max(scale, 0.1), 0, 1);
    const py = y + (1 - ratio) * (graphHeight - 14);
    return { ...point, x: px, y: py };
  });

  if (normalized.length > 1) {
    ctx.beginPath();
    ctx.moveTo(normalized[0].x, axisY);
    normalized.forEach((point, index) => {
      if (index === 0) {
        ctx.lineTo(point.x, point.y);
      } else {
        const previous = normalized[index - 1];
        const midX = (previous.x + point.x) / 2;
        ctx.quadraticCurveTo(previous.x, previous.y, midX, (previous.y + point.y) / 2);
        ctx.quadraticCurveTo(midX, (previous.y + point.y) / 2, point.x, point.y);
      }
    });
    ctx.lineTo(normalized[normalized.length - 1].x, axisY);
    ctx.closePath();
    ctx.fillStyle = "rgba(129,140,248,0.2)";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(normalized[0].x, normalized[0].y);
    normalized.forEach((point, index) => {
      if (index === 0) return;
      const previous = normalized[index - 1];
      const cx = (previous.x + point.x) / 2;
      const cy = (previous.y + point.y) / 2;
      ctx.quadraticCurveTo(previous.x, previous.y, cx, cy);
      ctx.quadraticCurveTo(cx, cy, point.x, point.y);
    });
    ctx.strokeStyle = "#818cf8";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(normalized[0].x, normalized[0].y, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#818cf8";
    ctx.fill();
  }

  ctx.fillStyle = "rgba(148,163,184,0.95)";
  ctx.font = "400 18px Poppins, sans-serif";
  ctx.textAlign = "center";
  normalized.forEach((point) => {
    ctx.fillText(point.shortName, point.x, axisY + 22);
  });

  return axisY + 30;
}

function drawBadgeAndFooter(ctx: DrawingContext, y: number, achievement: string): void {
  const centerX = CARD_SIZE / 2;
  const badgeW = 620;
  const badgeH = 54;
  const badgeX = centerX - badgeW / 2;
  const badgeY = y + 2;

  roundedRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeH / 2);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "500 22px Poppins, sans-serif";
  drawWrappedText(ctx, achievement, centerX, badgeY + 35, badgeW - 24, 24, 1);

  ctx.fillStyle = "rgba(148,163,184,0.95)";
  ctx.font = "400 18px Poppins, sans-serif";
  ctx.fillText("Tracked with SyncGrade · syncgrade.aurikrex.tech", centerX, badgeY + 82);
}

function drawTicker(ctx: DrawingContext): void {
  const tickerHeight = 34;
  const y = CARD_SIZE - tickerHeight;
  ctx.fillStyle = "#6366f1";
  ctx.fillRect(0, y, CARD_SIZE, tickerHeight);

  const text = "SyncGrade   SyncGrade   SyncGrade   SyncGrade   SyncGrade   SyncGrade";
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.font = "400 16px Poppins, sans-serif";
  ctx.fillText(text, 28, y + 22);
  ctx.font = "700 16px Poppins, sans-serif";
  ctx.fillText("SyncGrade", 30, y + 22);
  ctx.fillText("SyncGrade", 286, y + 22);
  ctx.fillText("SyncGrade", 542, y + 22);
  ctx.fillText("SyncGrade", 798, y + 22);
}

function findBestSemester(points: SemesterPoint[]): { gpa: string; name: string } {
  if (!points.length) return { gpa: "0.00", name: "No semesters yet" };
  const best = points.reduce((prev, current) => (current.gpa > prev.gpa ? current : prev), points[0]);
  return {
    gpa: formatGpa(best.gpa),
    name: best.name || "Semester",
  };
}

function drawShareCard(
  ctx: DrawingContext,
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
  const { cgpa, classification, totalCredits, studentName, programme, semesterGPAs, scale, semesters, admissionSession } = data;

  ctx.clearRect(0, 0, CARD_SIZE, CARD_SIZE);

  ctx.save();
  roundedRect(ctx, 0, 0, CARD_SIZE, CARD_SIZE, CARD_RADIUS);
  ctx.clip();

  const bgGradient = ctx.createLinearGradient(0, 0, CARD_SIZE, CARD_SIZE);
  bgGradient.addColorStop(0, "#0f172a");
  bgGradient.addColorStop(1, "#1a1040");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, CARD_SIZE, CARD_SIZE);

  drawHeader(ctx, getAcademicSessionLabel(admissionSession));
  const cgpaBottom = drawCgpaSection(ctx, cgpa, scale, classification);
  const levelLabel = levelFromSemesterCount(semesters.length);
  const identityBottom = drawIdentitySection(ctx, cgpaBottom + 2, studentName, levelLabel, programme);

  const points = mapSemesterPoints(semesterGPAs, semesters);
  const currentGpa = semesterGPAs.length > 0 ? formatGpa(semesterGPAs[semesterGPAs.length - 1] ?? 0) : "0.00";
  const best = findBestSemester(points);
  const completedSemesters = semesters.length;
  const totalSemesters = completedSemesters > 0 ? Math.ceil(completedSemesters / 2) * 2 : 0;

  const statsBottom = drawStatsGrid(ctx, identityBottom + 2, {
    currentGpa,
    creditsEarned: `${Math.round(totalCredits)}`,
    creditsMeta: "Credits Earned",
    bestGpa: best.gpa,
    bestSemesterName: best.name,
    semestersProgress: `${completedSemesters} of ${totalSemesters}`,
  });

  const graphBottom = drawTrendGraph(ctx, statsBottom + 6, points, scale);
  drawBadgeAndFooter(ctx, graphBottom, getAchievementText(classification, cgpa, scale));
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

  drawShareCard(ctx, {
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
