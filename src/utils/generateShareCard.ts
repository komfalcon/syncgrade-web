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
): context is CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D {
  return !!context && "fillText" in context;
}

function drawShareCard(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  cgpa: number,
  classification: string,
  totalCredits: number,
) {
  ctx.clearRect(0, 0, width, height);

  const background = "#0f0f0f";
  const primary = "#e6f7ff";
  const secondary = "#cbd5e1";
  const muted = "#94a3b8";
  const glow = ctx.createLinearGradient(0, 0, width, height);
  glow.addColorStop(0, "rgba(8,145,178,0.28)");
  glow.addColorStop(1, "rgba(14,116,144,0.08)");

  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(8,145,178,0.35)";
  ctx.lineWidth = 3;
  ctx.strokeRect(10, 10, width - 20, height - 20);

  ctx.textAlign = "center";
  ctx.fillStyle = primary;
  ctx.font = "700 84px Poppins, sans-serif";
  ctx.fillText(cgpa.toFixed(2), width / 2, 200);

  ctx.font = "500 32px Poppins, sans-serif";
  ctx.fillStyle = secondary;
  ctx.fillText(classification, width / 2, 255);

  ctx.font = "400 26px Poppins, sans-serif";
  ctx.fillStyle = muted;
  ctx.fillText(`Total Credits: ${totalCredits}`, width / 2, 305);

  ctx.textAlign = "right";
  ctx.font = "400 18px Poppins, sans-serif";
  ctx.fillStyle = muted;
  ctx.fillText("SyncGrade", width - 28, height - 28);
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

export async function generateShareCard(
  cgpa: number,
  classification: string,
  totalCredits: number,
): Promise<File> {
  const width = 1080;
  const height = 1080;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  if (!is2DContext(ctx)) {
    throw new Error("Canvas context not available");
  }

  drawShareCard(ctx, width, height, cgpa, classification, totalCredits);
  const blob = await canvasToBlob(canvas);
  return new File([blob], "syncgrade-cgpa-card.png", { type: "image/png" });
}
