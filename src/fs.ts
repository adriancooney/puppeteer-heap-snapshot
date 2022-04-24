import * as fs from "fs/promises";
import { deserializeHeapSnapshot, serializeHeapSnapshot } from "./serialize";
import { HeapSnapshot, SerializedHeapSnapshot } from "./types";

export async function readHeapSnapshot(
  filepath: string
): Promise<HeapSnapshot> {
  return deserializeHeapSnapshot(
    JSON.parse(await fs.readFile(filepath, "utf-8")) as SerializedHeapSnapshot
  );
}

export async function writeHeapSnapshot(
  filepath: string,
  heapSnapshot: HeapSnapshot
) {
  await fs.writeFile(
    filepath,
    JSON.stringify(serializeHeapSnapshot(heapSnapshot))
  );
}
