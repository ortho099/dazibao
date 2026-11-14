import { useEffect, useRef, useState } from "react";
import { CaseSensitive, Download, ImagePlus, Move, RotateCcw, Shuffle } from "lucide-react";
import { PLATES } from "@/lib/plates";
import { nextJoke } from "@/lib/lines";
import {
  CANVAS_SIZE,
  CLASSIC,
  PRESETS,
  blankCaptions,
  hitTest,
  renderMeme,
  type Caption,
  type CaptionId,
  type HitBox,
  type Preset,
  type Tone,
} from "@/lib/meme";

type StudioState = {
  top: Caption;
  bottom: Caption;
  tone: Tone;
  upper: boolean;
  presetId: string | null;
};

const INITIAL: StudioState = {
  top: { ...CLASSIC.top, text: "我沒問題" },
  bottom: { ...CLASSIC.bottom, text: "我全是問題" },
  tone: "paper",
  upper: false,
  presetId: "classic",
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function MemeStudio() {
  const [state, setState] = useState<StudioState>(INITIAL);
  const [selected, setSelected] = useState<CaptionId>("top");
  const [plateId, setPlateId] = useState(PLATES[0].id);
  const [src, setSrc] = useState(PLATES[0].src);
  const [uploadName, setUploadName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [draggingFile, setDraggingFile] = useState(false);
  const [ready, setReady] = useState(false);
  const [saveUrl, setSaveUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const boxesRef = useRef<HitBox[]>([]);
  const stateRef = useRef(state);
  const selectedRef = useRef(selected);
  const dragRef = useRef<{ id: CaptionId; dx: number; dy: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadUrl = useRef<string | null>(null);
  const textRefs = useRef<Partial<Record<CaptionId, HTMLTextAreaElement | null>>>({});
  const lastTap = useRef(0);
  const dragDepth = useRef(0);

  stateRef.current = state;
  selectedRef.current = selected;

  useEffect(() => {
    let cancel = false;
    const sample = "大字報我沒問題 ABCabc";
    Promise.all([
      document.fonts.load(`900 ${Math.round(CANVAS_SIZE * 0.08)}px "Noto Sans TC"`, sample),
      document.fonts.load(`500 16px "Noto Sans TC"`, sample),
    ]).finally(() => {
      if (!cancel) setReady(true);
    });
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    let cancel = false;
    const img = new Image();
    img.onload = () => {
      if (cancel) return;
      imageRef.current = img;
      paint();
    };
    img.onerror = () => {
      if (cancel) return;
      imageRef.current = null;
      setFileError("這張圖載入失敗，換一張試試。");
      paint();
    };
    img.src = src;
    return () => {
      cancel = true;
    };
    // Reloads when the plate changes. paint reads refs, so captions stay current.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  useEffect(() => {
    paint();
  }, [state, selected, ready]);

  function paint(mode: "edit" | "export" = "edit") {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const current = stateRef.current;
    boxesRef.current = renderMeme(ctx, {
      top: current.top,
      bottom: current.bottom,
      tone: current.tone,
      upper: current.upper,
      selected: selectedRef.current,
      mode,
      image: imageRef.current,
    });
  }

  function patchCaption(id: CaptionId, partial: Partial<Caption>, customLayout: boolean) {
    setState((current) => ({
      ...current,
      presetId: customLayout ? null : current.presetId,
      [id]: { ...current[id], ...partial },
    }));
  }

  function applyPreset(preset: Preset) {
    setState((current) => ({
      ...current,
      presetId: preset.id,
      top: { ...current.top, ...preset.top },
      bottom: { ...current.bottom, ...preset.bottom },
    }));
  }

  function fillJoke() {
    const tag = plateId === "upload" ? "any" : plateId;
    const joke = nextJoke(tag, stateRef.current.top.text);
    setState((current) => ({
      ...current,
      top: { ...current.top, text: joke.top },
      bottom: { ...current.bottom, text: joke.bottom },
    }));
  }

  function resetText() {
    const blank = blankCaptions();
    setState({
      top: blank.top,
      bottom: blank.bottom,
      tone: "paper",
      upper: false,
      presetId: "classic",
    });
    setSelected("top");
  }

  function choosePlate(id: string, nextSrc: string) {
    setPlateId(id);
    setSrc(nextSrc);
    setFileError(null);
  }

  function takeFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFileError("請選圖片檔。");
      return;
    }
    if (uploadUrl.current) URL.revokeObjectURL(uploadUrl.current);
    const url = URL.createObjectURL(file);
    uploadUrl.current = url;
    setUploadName(file.name);
    setFileError(null);
    setPlateId("upload");
    setSrc(url);
  }

  function pointOf(event: { clientX: number; clientY: number }) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
      scale: canvas.width / rect.width,
    };
  }

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const point = pointOf(event);
    if (!canvas || !point) return;
    const id = hitTest(boxesRef.current, point.x, point.y, 24 * point.scale);
    if (!id) return;
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    const caption = stateRef.current[id];
    dragRef.current = {
      id,
      dx: point.x - caption.x * canvas.width,
      dy: point.y - caption.y * canvas.height,
    };
    if (selectedRef.current === id && Date.now() - lastTap.current < 320) {
      textRefs.current[id]?.focus();
    }
    lastTap.current = Date.now();
    setSelected(id);
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const drag = dragRef.current;
    const canvas = canvasRef.current;
    const point = pointOf(event);
    if (!drag || !canvas || !point) return;
    patchCaption(
      drag.id,
      {
        x: clamp((point.x - drag.dx) / canvas.width, 0.08, 0.92),
        y: clamp((point.y - drag.dy) / canvas.height, 0.06, 0.94),
      },
      true,
    );
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "TEXTAREA" || target.tagName === "INPUT")
      ) {
        return;
      }
      const id = selectedRef.current;
      const step = event.shiftKey ? 0.02 : 0.008;
      let dx = 0;
      let dy = 0;
      if (event.key === "ArrowLeft") dx = -step;
      else if (event.key === "ArrowRight") dx = step;
      else if (event.key === "ArrowUp") dy = -step;
      else if (event.key === "ArrowDown") dy = step;
      else return;
      event.preventDefault();
      const caption = stateRef.current[id];
      patchCaption(
        id,
        { x: clamp(caption.x + dx, 0.08, 0.92), y: clamp(caption.y + dy, 0.06, 0.94) },
        true,
      );
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function exportBlob(): Promise<Blob | null> {
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = CANVAS_SIZE;
    exportCanvas.height = CANVAS_SIZE;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return Promise.resolve(null);
    const current = stateRef.current;
    renderMeme(ctx, {
      top: current.top,
      bottom: current.bottom,
      tone: current.tone,
      upper: current.upper,
      selected: null,
      mode: "export",
      image: imageRef.current,
    });
    return new Promise((resolve) => exportCanvas.toBlob(resolve, "image/png"));
  }

  function rememberSave(blob: Blob) {
    const url = URL.createObjectURL(blob);
    setSaveUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return url;
    });
  }

  function closeSave() {
    setSaveUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });
  }

  function saveWithLink(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "dazibao.png";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  async function download() {
    const blob = await exportBlob();
    if (!blob) {
      setFileError("圖片沒有做成，請再按一次。");
      return;
    }
    const file = new File([blob], "dazibao.png", { type: "image/png" });
    const canShare =
      typeof navigator.share === "function" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [file] });
    if (canShare) {
      try {
        await navigator.share({ files: [file], title: "大字報" });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    const iphone = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const framed = window.parent !== window;
    if (iphone || (framed && navigator.maxTouchPoints > 0)) {
      rememberSave(blob);
      return;
    }
    saveWithLink(blob);
  }

  const active = state[selected];
  const hint = PRESETS.find((preset) => preset.id === state.presetId)?.hint ?? "已手動調過位置或字級。";

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="sticky top-0 z-30 border-b border-border bg-bg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-control bg-primary text-xl font-black text-primary-fg">
              報
            </span>
            <div>
              <h1 className="text-xl font-black leading-tight text-balance">大字報</h1>
              <p className="text-sm text-muted">拖字、調邊、下載。</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={resetText}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-control border border-border bg-raised px-3 text-sm font-bold transition-colors duration-200 hover:bg-border"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              重置
            </button>
            <button
              type="button"
              onClick={() => void download()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-control bg-primary px-3 text-sm font-bold text-primary-fg transition-opacity duration-200 hover:opacity-90"
            >
              <Download className="size-4" aria-hidden="true" />
              下載
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-5 lg:grid-cols-5">
        <section className="min-w-0 lg:col-span-3">
          <div
            className={`stage-shadow relative rounded-card border bg-bg p-3 ${draggingFile ? "border-primary" : "border-border"}`}
            onDragEnter={(event) => {
              event.preventDefault();
              dragDepth.current += 1;
              setDraggingFile(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => {
              dragDepth.current = Math.max(0, dragDepth.current - 1);
              if (dragDepth.current === 0) setDraggingFile(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              dragDepth.current = 0;
              setDraggingFile(false);
              takeFile(event.dataTransfer.files[0]);
            }}
          >
            <span className="pointer-events-none absolute top-2 left-2 size-3 border-t-2 border-l-2 border-primary" />
            <span className="pointer-events-none absolute top-2 right-2 size-3 border-t-2 border-r-2 border-primary" />
            <span className="pointer-events-none absolute bottom-2 left-2 size-3 border-b-2 border-l-2 border-primary" />
            <span className="pointer-events-none absolute right-2 bottom-2 size-3 border-r-2 border-b-2 border-primary" />
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              aria-label="迷因預覽，可拖曳上下文字"
              className="aspect-square h-auto w-full cursor-grab touch-none rounded-control select-none active:cursor-grabbing"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onContextMenu={(event) => event.preventDefault()}
            />
          </div>
          <p className="mt-3 flex items-center gap-2 text-sm text-muted">
            <Move className="size-4 shrink-0" aria-hidden="true" />
            按「換一句」就會自己出字。想改位置，按住文字拖曳。
          </p>
        </section>

        <aside className="flex min-w-0 flex-col gap-5 lg:col-span-2">
          <section className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
            <h2 className="text-sm font-bold">不用打字</h2>
            <ol className="flex flex-col gap-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-black text-primary-fg">
                  1
                </span>
                選一張底圖，或上傳自己的圖
              </li>
              <li className="flex items-center gap-2">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-black text-primary-fg">
                  2
                </span>
                按下面的按鈕，上下兩句會自己出現
              </li>
              <li className="flex items-center gap-2">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-black text-primary-fg">
                  3
                </span>
                喜歡就按右上角的下載
              </li>
            </ol>
            <button
              type="button"
              onClick={fillJoke}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-control bg-primary px-4 text-sm font-bold text-primary-fg transition-opacity duration-200 hover:opacity-90"
            >
              <Shuffle className="size-4" aria-hidden="true" />
              換一句
            </button>
            <p className="text-sm text-pretty text-muted">再按一次就換另一組。想改字，下面的框還是可以打。</p>
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold">底圖</h2>
              <button
                type="button"
                className="inline-flex h-11 items-center gap-2 rounded-control bg-raised px-3 text-sm font-bold transition-colors duration-200 hover:bg-border"
                onClick={() => fileRef.current?.click()}
              >
                <ImagePlus className="size-4" aria-hidden="true" />
                上傳圖片
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => {
                  takeFile(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </div>
            <div className="scroller -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {uploadUrl.current && uploadName ? (
                <PlateButton
                  name="我的圖"
                  src={uploadUrl.current}
                  pressed={plateId === "upload"}
                  onClick={() => {
                    if (uploadUrl.current) choosePlate("upload", uploadUrl.current);
                  }}
                />
              ) : null}
              {PLATES.map((plate) => (
                <PlateButton
                  key={plate.id}
                  name={plate.name}
                  src={plate.src}
                  pressed={plateId === plate.id}
                  onClick={() => choosePlate(plate.id, plate.src)}
                />
              ))}
            </div>
            {fileError ? <p className="text-sm text-primary">{fileError}</p> : null}
          </section>

          <section className="flex flex-col gap-3 border-t border-border pt-5">
            <h2 className="text-sm font-bold">版面</h2>
            <div className="scroller -mx-1 flex gap-2 overflow-x-auto px-1">
              {PRESETS.map((preset) => {
                const on = state.presetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => applyPreset(preset)}
                    className={`h-11 shrink-0 rounded-control px-3 text-sm font-bold transition-colors duration-200 ${on ? "bg-primary text-primary-fg" : "bg-raised text-fg hover:bg-border"}`}
                  >
                    {preset.name}
                  </button>
                );
              })}
            </div>
            <p className="text-sm text-pretty text-muted">{hint}</p>
          </section>

          <section className="flex flex-col gap-3 border-t border-border pt-5">
            <CaptionField
              id="top"
              label="上方文字"
              value={state.top.text}
              selected={selected === "top"}
              placeholder="輸入上方那句"
              inputRef={(node) => {
                textRefs.current.top = node;
              }}
              onFocus={() => setSelected("top")}
              onChange={(text) => patchCaption("top", { text }, false)}
            />
            <CaptionField
              id="bottom"
              label="下方文字"
              value={state.bottom.text}
              selected={selected === "bottom"}
              placeholder="輸入下方那句"
              inputRef={(node) => {
                textRefs.current.bottom = node;
              }}
              onFocus={() => setSelected("bottom")}
              onChange={(text) => patchCaption("bottom", { text }, false)}
            />
          </section>

          <section className="flex flex-col gap-2 border-t border-border pt-5">
            <h2 className="text-sm font-bold">{selected === "top" ? "上方" : "下方"}的字</h2>
            <label className="block">
              <span className="flex items-center justify-between text-sm font-bold">
                字級
                <span className="tabular-nums font-medium text-muted">
                  {Math.round(active.size * CANVAS_SIZE)}
                </span>
              </span>
              <input
                type="range"
                min={36}
                max={150}
                step={1}
                aria-label={selected === "top" ? "上方文字字級" : "下方文字字級"}
                value={Math.round(active.size * CANVAS_SIZE)}
                onChange={(event) =>
                  patchCaption(selected, { size: Number(event.target.value) / CANVAS_SIZE }, true)
                }
              />
            </label>
            <label className="block">
              <span className="flex items-center justify-between text-sm font-bold">
                描邊
                <span className="tabular-nums font-medium text-muted">
                  {Math.round(active.stroke * 100)}
                </span>
              </span>
              <input
                type="range"
                min={0}
                max={36}
                step={1}
                aria-label={selected === "top" ? "上方文字描邊" : "下方文字描邊"}
                value={Math.round(active.stroke * 100)}
                onChange={(event) =>
                  patchCaption(selected, { stroke: Number(event.target.value) / 100 }, true)
                }
              />
            </label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <button
                type="button"
                aria-pressed={state.tone === "paper"}
                onClick={() => setState((current) => ({ ...current, tone: "paper" }))}
                className={`inline-flex h-12 items-center justify-center gap-2 rounded-control px-2 text-sm font-bold transition-colors duration-200 ${state.tone === "paper" ? "bg-primary text-primary-fg" : "bg-raised text-fg hover:bg-border"}`}
              >
                <span className="swatch-paper" aria-hidden="true">
                  文
                </span>
                白字黑邊
              </button>
              <button
                type="button"
                aria-pressed={state.tone === "ink"}
                onClick={() => setState((current) => ({ ...current, tone: "ink" }))}
                className={`inline-flex h-12 items-center justify-center gap-2 rounded-control px-2 text-sm font-bold transition-colors duration-200 ${state.tone === "ink" ? "bg-primary text-primary-fg" : "bg-raised text-fg hover:bg-border"}`}
              >
                <span className="swatch-ink" aria-hidden="true">
                  文
                </span>
                黑字白邊
              </button>
            </div>
            <button
              type="button"
              aria-pressed={state.upper}
              onClick={() => setState((current) => ({ ...current, upper: !current.upper }))}
              className={`inline-flex h-11 items-center justify-between rounded-control px-3 text-sm font-bold transition-colors duration-200 ${state.upper ? "bg-primary text-primary-fg" : "bg-raised text-fg hover:bg-border"}`}
            >
              <span className="inline-flex items-center gap-2">
                <CaseSensitive className="size-4" aria-hidden="true" />
                英文全大寫
              </span>
              <span>{state.upper ? "開" : "關"}</span>
            </button>
          </section>
        </aside>
      </div>
      {saveUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="save-title"
        >
          <div className="w-full max-w-md rounded-card border border-border bg-bg p-4">
            <h2 id="save-title" className="text-lg font-black">
              儲存這張圖
            </h2>
            <p className="mt-1 text-sm text-pretty text-muted">
              手機裡的預覽不能直接下載。長按下面的圖，再點「儲存影像」。
            </p>
            <img
              src={saveUrl}
              alt="完成的大字報"
              className="mt-3 w-full rounded-control"
              style={{ WebkitTouchCallout: "default" }}
            />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <a
                href={saveUrl}
                download="dazibao.png"
                className="inline-flex h-12 items-center justify-center rounded-control bg-primary px-3 text-sm font-bold text-primary-fg"
              >
                再試下載
              </a>
              <button
                type="button"
                onClick={closeSave}
                className="inline-flex h-12 items-center justify-center rounded-control bg-raised px-3 text-sm font-bold"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PlateButton({
  name,
  src,
  pressed,
  onClick,
}: {
  name: string;
  src: string;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" aria-pressed={pressed} onClick={onClick} className="w-16 shrink-0">
      <span
        className={`block size-16 overflow-hidden rounded-control border-2 ${pressed ? "border-primary" : "border-border"}`}
      >
        <img src={src} alt="" className="h-full w-full object-cover" />
      </span>
      <span className={`mt-1 block truncate text-center text-xs ${pressed ? "font-bold text-fg" : "text-muted"}`}>
        {name}
      </span>
    </button>
  );
}

function CaptionField({
  id,
  label,
  value,
  placeholder,
  selected,
  onChange,
  onFocus,
  inputRef,
}: {
  id: CaptionId;
  label: string;
  value: string;
  placeholder: string;
  selected: boolean;
  onChange: (value: string) => void;
  onFocus: () => void;
  inputRef: (node: HTMLTextAreaElement | null) => void;
}) {
  return (
    <label className="block" htmlFor={`caption-${id}`}>
      <span className="mb-1 flex items-center gap-2 text-sm font-bold">
        <span className={`size-2 rounded-full ${selected ? "bg-primary" : "bg-border"}`} />
        {label}
      </span>
      <textarea
        id={`caption-${id}`}
        ref={inputRef}
        rows={2}
        value={value}
        placeholder={placeholder}
        spellCheck={false}
        onFocus={onFocus}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full resize-none rounded-control border bg-raised px-3 py-2 text-base text-fg transition-colors duration-200 placeholder:text-muted ${selected ? "border-primary" : "border-border"}`}
      />
    </label>
  );
}
