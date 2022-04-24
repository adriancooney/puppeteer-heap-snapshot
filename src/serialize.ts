import { HeapSnapshot, SerializedHeapSnapshot } from "./types";

export function serializeHeapSnapshot(
  heapSnapshot: HeapSnapshot
): SerializedHeapSnapshot {
  return {
    ...heapSnapshot,
    nodes: Array.from(heapSnapshot.nodes),
    edges: Array.from(heapSnapshot.edges),
  };
}

export function deserializeHeapSnapshot(
  serializedHeapSnapshot: SerializedHeapSnapshot
): HeapSnapshot {
  return {
    ...serializedHeapSnapshot,
    nodes: Uint32Array.from(serializedHeapSnapshot.nodes),
    edges: Uint32Array.from(serializedHeapSnapshot.edges),
  };
}
