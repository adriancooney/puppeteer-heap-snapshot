import { Page } from "puppeteer";
import { captureHeapSnapshot } from "../src/capture";
import { setupBrowser } from "./fixtures/browser";

describe("capture", () => {
  describe("captureHeapSnapshot", () => {
    jest.setTimeout(30000);

    const { withPage } = setupBrowser();

    it("captures a heap snapshot", async () => {
      await withPage(async (page: Page) => {
        await page.evaluate(() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).heapObject = {
            myUniquePropertyKeyFooBar: 1,
          };
        });

        const heapSnapshot = await captureHeapSnapshot(await page.target());

        expect(heapSnapshot).toBeTruthy();
        expect(Object.keys(heapSnapshot).sort()).toMatchInlineSnapshot(`
          Array [
            "edges",
            "locations",
            "nodes",
            "samples",
            "snapshot",
            "strings",
            "trace_function_infos",
            "trace_tree",
          ]
        `);
        expect(heapSnapshot.strings.includes("myUniquePropertyKeyFooBar")).toBe(
          true
        );
      });
    });
  });
});
