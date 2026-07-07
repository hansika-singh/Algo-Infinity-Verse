import fs from "fs/promises";
import path from "path";
import { applySM2 } from "./sm2.js";

export { applySM2 };

const DATA_DIR = path.join(process.cwd(), "data");
const MEMORY_FILE = path.join(DATA_DIR, "memory.json");
let memoryWriteQueue = Promise.resolve();

export async function ensureMemoryStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(MEMORY_FILE);
  } catch {
    await fs.writeFile(MEMORY_FILE, "{}\n");
  }
}

export async function readMemoryStore() {
  await ensureMemoryStore();
  const raw = await fs.readFile(MEMORY_FILE, "utf8");
  return JSON.parse(raw || "{}");
}

export async function writeMemoryStoreAtomic(filePath, store) {
  const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmpPath, `${JSON.stringify(store, null, 2)}\n`);
  await fs.rename(tmpPath, filePath);
}

export async function updateMemoryStore(mutator) {
  const task = memoryWriteQueue.then(async () => {
    await ensureMemoryStore();
    const raw = await fs.readFile(MEMORY_FILE, "utf8");
    const store = JSON.parse(raw || "{}");
    const updated = await mutator(store);
    await writeMemoryStoreAtomic(MEMORY_FILE, store);
    return updated;
  });
  memoryWriteQueue = task.catch(() => {});
  return task;
}
