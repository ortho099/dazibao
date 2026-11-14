export const CANVAS_SIZE = 1080;

export const INK = "#12110e";
export const PAPER = "#f6f1e7";
export const CADMIUM = "#f0c14b";

const FONT = '"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif';

export type CaptionId = "top" | "bottom";
export type Tone = "paper" | "ink";

export type CaptionLayout = {
  x: number;
  y: number;
  size: number;
  stroke: number;
};

export type Caption = CaptionLayout & { text: string };

export type Preset = {
  id: string;
  name: string;
  hint: string;
  top: CaptionLayout;
  bottom: CaptionLayout;
};

export const PRESETS: Preset[] = [
  {
    id: "classic",
    name: "經典上下",
    hint: "白字黑邊，頂一句、底一句。",
    top: { x: 0.5, y: 0.12, size: 0.084, stroke: 0.18 },
    bottom: { x: 0.5, y: 0.88, size: 0.084, stroke: 0.18 },
  },
  {
    id: "headline",
    name: "只要標題",
    hint: "上方大字，底部收成小註。",
    top: { x: 0.5, y: 0.14, size: 0.108, stroke: 0.2 },
    bottom: { x: 0.5, y: 0.92, size: 0.046, stroke: 0.14 },
  },
  {
    id: "punch",
    name: "只要吐槽",
    hint: "重點壓在最下面。",
    top: { x: 0.5, y: 0.08, size: 0.046, stroke: 0.14 },
    bottom: { x: 0.5, y: 0.84, size: 0.108, stroke: 0.2 },
  },
  {
    id: "stack",
    name: "置中疊句",
    hint: "兩句都堆在畫面中央。",
    top: { x: 0.5, y: 0.42, size: 0.078, stroke: 0.18 },
    bottom: { x: 0.5, y: 0.58, size: 0.078, stroke: 0.18 },
  },
  {
    id: "shout",
    name: "粗框大喊",
    hint: "字更大，描邊更厚。",
    top: { x: 0.5, y: 0.16, size: 0.12, stroke: 0.3 },
    bottom: { x: 0.5, y: 0.84, size: 0.12, stroke: 0.3 },
  },
  {
    id: "aside",
    name: "細字旁白",
    hint: "小聲講完就好。",
    top: { x: 0.5, y: 0.08, size: 0.048, stroke: 0.12 },
    bottom: { x: 0.5, y: 0.92, size: 0.048, stroke: 0.12 },
  },
];

export const CLASSIC = PRESETS[0];

export function blankCaptions(): { top: Caption; bottom: Caption } {
  return {
    top: { ...CLASSIC.top, text: "" },
    bottom: { ...CLASSIC.bottom, text: "" },
  };
}

export type HitBox = {
  id: CaptionId;
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
};

export type RenderInput = {
  top: Caption;
  bottom: Caption;
  tone: Tone;
  upper: boolean;
  selected: CaptionId | null;
  mode: "edit" | "export";
  image: CanvasImageSource | null;
};

const PLACEHOLDER: Record<CaptionId, string> = {
  top: "上方文字",
  bottom: "下方文字",
};

export function renderMeme(ctx: CanvasRenderingContext2D, input: RenderInput): HitBox[] {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, width, height);

  if (input.image) {
    drawCover(ctx, input.image, width, height);
  }

  const boxes: HitBox[] = [];
  for (const id of ["top", "bottom"] as const) {
    const box = drawCaption(ctx, id, input);
    if (box) boxes.push(box);
  }
  return boxes;
}

function drawCaption(
  ctx: CanvasRenderingContext2D,
  id: CaptionId,
  input: RenderInput,
): HitBox | null {
  const caption = input[id];
  const ghost = caption.text.trim().length === 0;
  if (ghost && input.mode === "export") return null;

  const source = ghost
    ? PLACEHOLDER[id]
    : input.upper
      ? caption.text.toLocaleUpperCase("en")
      : caption.text;

  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const fontSize = Math.max(12, caption.size * width);
  const maxWidth = width * 0.9;
  ctx.font = `900 ${fontSize}px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const lines = wrapText(ctx, source, maxWidth);
  const lineHeight = fontSize * 1.16;
  const blockHeight = Math.max(lineHeight, lines.length * lineHeight);
  const centerX = caption.x * width;
  const centerY = caption.y * height;
  const startY = centerY - blockHeight / 2 + lineHeight / 2;

  const fill = input.tone === "paper" ? PAPER : INK;
  const stroke = input.tone === "paper" ? INK : PAPER;
  const visibleStroke = fontSize * caption.stroke;

  ctx.save();
  ctx.globalAlpha = ghost ? 0.55 : 1;
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;
  ctx.lineWidth = visibleStroke * 2;
  ctx.strokeStyle = stroke;
  ctx.fillStyle = ghost ? PAPER : fill;

  let widest = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const y = startY + i * lineHeight;
    if (!ghost && visibleStroke > 0.5) ctx.strokeText(line, centerX, y);
    ctx.fillText(line, centerX, y);
    widest = Math.max(widest, ctx.measureText(line).width);
  }
  ctx.restore();

  const pad = fontSize * 0.28;
  const box: HitBox = {
    id,
    x: centerX - widest / 2 - pad,
    y: centerY - blockHeight / 2 - pad,
    w: widest + pad * 2,
    h: blockHeight + pad * 2,
    cx: centerX,
    cy: centerY,
  };

  if (input.mode === "edit" && input.selected === id) {
    ctx.save();
    ctx.strokeStyle = CADMIUM;
    ctx.lineWidth = Math.max(3, width * 0.004);
    ctx.setLineDash([14, 10]);
    ctx.beginPath();
    const radius = Math.max(8, fontSize * 0.15);
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(box.x, box.y, box.w, box.h, radius);
    } else {
      ctx.rect(box.x, box.y, box.w, box.h);
    }
    ctx.stroke();
    ctx.restore();
  }

  return box;
}

export function hitTest(boxes: HitBox[], x: number, y: number, pad: number): CaptionId | null {
  const hits = boxes.filter(
    (box) =>
      x >= box.x - pad &&
      x <= box.x + box.w + pad &&
      y >= box.y - pad &&
      y <= box.y + box.h + pad,
  );
  if (hits.length === 0) return null;
  hits.sort((a, b) => {
    const da = (a.cx - x) ** 2 + (a.cy - y) ** 2;
    const db = (b.cx - x) ** 2 + (b.cy - y) ** 2;
    return da - db;
  });
  return hits[0]?.id ?? null;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    if (raw.length === 0) {
      lines.push("");
      continue;
    }
    const tokens = raw.match(/[A-Za-z0-9'’-]+|\s+|./gu) ?? [raw];
    let line = "";
    for (const token of tokens) {
      const next = line + token;
      if (line && ctx.measureText(next).width > maxWidth) {
        lines.push(line.replace(/\s+$/u, ""));
        line = breakWide(ctx, token.trimStart(), maxWidth, lines);
      } else {
        line = next;
      }
    }
    lines.push(line.replace(/\s+$/u, ""));
  }
  return lines.length > 0 ? lines : [""];
}

function breakWide(
  ctx: CanvasRenderingContext2D,
  token: string,
  maxWidth: number,
  lines: string[],
): string {
  if (ctx.measureText(token).width <= maxWidth) return token;
  let buf = "";
  for (const ch of token) {
    if (buf && ctx.measureText(buf + ch).width > maxWidth) {
      lines.push(buf);
      buf = ch;
    } else {
      buf += ch;
    }
  }
  return buf;
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  width: number,
  height: number,
) {
  if (!(image instanceof HTMLImageElement)) return;
  const iw = image.naturalWidth;
  const ih = image.naturalHeight;
  if (!iw || !ih) return;
  const scale = Math.max(width / iw, height / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  ctx.drawImage(image, (width - dw) / 2, (height - dh) / 2, dw, dh);
}
