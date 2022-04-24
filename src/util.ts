import Debug from "debug";

export const debug = Debug("puppeteer-heap-snapshot");

export function enableDebugLogging() {
  Debug.enable(`${process.env.DEBUG} puppeteer-heap-snapshot`);
}
