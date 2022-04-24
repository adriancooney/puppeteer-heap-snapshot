import { Target } from "puppeteer";
import { deserializeHeapSnapshot } from "./serialize";
import { HeapSnapshot, SerializedHeapSnapshot } from "./types";
import { debug } from "./util";

const HEAP_SNAPSHOT_TIMEOUT = 30000;

export async function captureHeapSnapshot(
  target: Target
): Promise<HeapSnapshot> {
  const cdpSession = await target.createCDPSession();
  const cdpSessionConnection = cdpSession.connection()!;

  debug("taking heap snapshot");

  return await new Promise((_resolve, _reject) => {
    let heapSnapshotSize = 0;
    let heapSnapshotResolved = false;
    let heapSnapshotTimeout: ReturnType<typeof setTimeout> | null = null;
    const heapSnapshotChunks: string[] = [];

    const resolve = (snapshot: HeapSnapshot) => {
      heapSnapshotResolved = true;
      _resolve(snapshot);
    };

    const reject = (error: Error) => {
      if (!heapSnapshotResolved) {
        _reject(error);
      }
    };

    cdpSession.on(
      "HeapProfiler.addHeapSnapshotChunk",
      ({ chunk }: { chunk: string }) => {
        heapSnapshotSize += chunk.length;
        heapSnapshotChunks.push(chunk);

        debug(
          `heap snapshot chunk: size ${chunk.length}, total ${heapSnapshotSize}`
        );

        if (chunk[chunk.length - 1] === "}") {
          try {
            const snapshotResponse = JSON.parse(
              heapSnapshotChunks.join("")
            ) as SerializedHeapSnapshot;

            if (heapSnapshotTimeout) {
              clearTimeout(heapSnapshotTimeout);
            }

            resolve(deserializeHeapSnapshot(snapshotResponse));
          } catch (err) {
            // Ignore JSON parser errors, may not be complete snapshot
          }
        }
      }
    );

    cdpSession.on(
      "HeapProfiler.reportHeapSnapshotProgress",
      ({
        done,
        total,
        finished,
      }: {
        done: number;
        total: number;
        finished?: boolean;
      }) => {
        debug(
          `heap snapshot progress: ${done}/${total} (finished = ${
            finished || false
          })`
        );

        if (heapSnapshotTimeout) {
          clearTimeout(heapSnapshotTimeout);
        }

        heapSnapshotTimeout = setTimeout(() => {
          reject(new Error("Heap snapshot operation timed out"));
        }, HEAP_SNAPSHOT_TIMEOUT);
      }
    );

    cdpSession.send("HeapProfiler.takeHeapSnapshot", {
      // `reportProgress` events aren't useful for actually tracking real progress, only for the
      // DevTools UI. There's a race condition with the event emitter between UI finish and real finish.
      // Instead we track progress by trying to parse the raw json data if the last character in the chunk
      // is "}". We use the progress to start a timer that if we don't receieve the snapshot within X seconds, we fail.
      // This means we won't indefinitely hang waiting for chunks. Not ideal but works.
      reportProgress: true,
      captureNumericValue: true,
    });

    cdpSessionConnection.on("error", reject);
    cdpSessionConnection.on("close", () =>
      reject(new Error("CDP Session closed prematurely"))
    );
  });
}
