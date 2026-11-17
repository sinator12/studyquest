import type { CharacterArtwork } from "./artwork";

const spriteCache = new Map<string, Promise<string>>();

function isLightBackdrop(r: number, g: number, b: number): boolean {
  const brightest = Math.max(r, g, b);
  const darkest = Math.min(r, g, b);
  const brightness = (r + g + b) / 3;
  return brightness >= 211 && brightest - darkest <= 76;
}

function removeConnectedBackdrop(imageData: ImageData): void {
  const { data, width, height } = imageData;
  const total = width * height;
  const visited = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  const seed = (index: number) => {
    if (visited[index]) return;
    const pixel = index * 4;
    if (!isLightBackdrop(data[pixel], data[pixel + 1], data[pixel + 2])) return;
    visited[index] = 1;
    queue[tail++] = index;
  };

  for (let x = 0; x < width; x += 1) {
    seed(x);
    seed((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    seed(y * width);
    seed(y * width + width - 1);
  }

  while (head < tail) {
    const index = queue[head++];
    const pixel = index * 4;
    data[pixel + 3] = 0;
    const x = index % width;
    const y = Math.floor(index / width);

    if (x > 0) seed(index - 1);
    if (x < width - 1) seed(index + 1);
    if (y > 0) seed(index - width);
    if (y < height - 1) seed(index + width);
  }

  // Remove only light, connected antialias pixels along the keyed edge.
  for (let index = 0; index < total; index += 1) {
    if (visited[index]) continue;
    const x = index % width;
    const y = Math.floor(index / width);
    let touchesBackdrop = false;
    if (x > 0) touchesBackdrop ||= visited[index - 1] === 1;
    if (x < width - 1) touchesBackdrop ||= visited[index + 1] === 1;
    if (y > 0) touchesBackdrop ||= visited[index - width] === 1;
    if (y < height - 1) touchesBackdrop ||= visited[index + width] === 1;
    if (!touchesBackdrop) continue;
    const pixel = index * 4;
    const brightness = (data[pixel] + data[pixel + 1] + data[pixel + 2]) / 3;
    const spread = Math.max(data[pixel], data[pixel + 1], data[pixel + 2]) -
      Math.min(data[pixel], data[pixel + 1], data[pixel + 2]);
    if (brightness >= 192 && spread <= 82) data[pixel + 3] = 0;
  }
}

function findVisibleBounds(imageData: ImageData): { x: number; y: number; width: number; height: number } {
  const { data, width, height } = imageData;
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] === 0) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }

  if (right < left || bottom < top) {
    throw new Error("The selected artwork crop contains no visible character pixels.");
  }

  return { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.decoding = "async";
  image.src = src;
  await image.decode();
  return image;
}

export function cropArtwork(artwork: CharacterArtwork): Promise<string> {
  const { src, rect } = artwork;
  const key = `${src}:${rect.x},${rect.y},${rect.width},${rect.height}`;
  const existing = spriteCache.get(key);
  if (existing) return existing;

  const task = loadImage(src).then((image) => {
    const canvas = document.createElement("canvas");
    canvas.width = rect.width;
    canvas.height = rect.height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Canvas is unavailable in this browser.");

    context.imageSmoothingEnabled = false;
    context.drawImage(
      image,
      rect.x,
      rect.y,
      rect.width,
      rect.height,
      0,
      0,
      rect.width,
      rect.height,
    );
    const pixels = context.getImageData(0, 0, rect.width, rect.height);
    removeConnectedBackdrop(pixels);
    context.putImageData(pixels, 0, 0);

    const bounds = findVisibleBounds(pixels);
    const sprite = document.createElement("canvas");
    sprite.width = bounds.width;
    sprite.height = bounds.height;
    const spriteContext = sprite.getContext("2d");
    if (!spriteContext) throw new Error("Canvas is unavailable in this browser.");
    spriteContext.imageSmoothingEnabled = false;
    spriteContext.putImageData(
      context.getImageData(bounds.x, bounds.y, bounds.width, bounds.height),
      0,
      0,
    );
    return sprite.toDataURL("image/png");
  });

  spriteCache.set(key, task);
  task.catch(() => spriteCache.delete(key));
  return task;
}
