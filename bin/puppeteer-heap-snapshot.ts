#!/usr/bin/env node
import * as path from "path";
import { program } from "commander";
import { Browser, Page } from "puppeteer";
import * as Puppeteer from "puppeteer";
import { writeHeapSnapshot, readHeapSnapshot } from "../src/fs";
import { HeapSnapshot } from "../src/types";
import { captureHeapSnapshot } from "../src/capture";
import { findObjectsWithProperties } from "../src";
import { enableDebugLogging } from "../src/util";

if (require.main === module) {
  const castProperties = (value: string): string[] => value.split(/\s*,\s*/);
  const toNumberOrIfinity = (value: string): number => {
    const maybeValidNumber = Number.parseInt(value);
    return Number.isNaN(maybeValidNumber) ? Infinity : maybeValidNumber;
  };

  program
    .option("--debug", "Enable debug mode (non-headless Chrome, debug logging)")
    .option("--no-headless", "Do not run Chrome in headless mode", true)
    .option(
      "-w, --wait <timeout>",
      "Add a wait time before taking a heap snapshot",
      "10000"
    );

  program
    .command("fetch")
    .description("fetch a heap snapshot for a URL and write to a file")
    .requiredOption("-u, --url <url>", "target url for the heap snapshot")
    .requiredOption(
      "-o, --output <filepath>",
      "output filepath",
      relativeFilepath
    )
    .action(writeHeapSnapshotCommand);

  program
    .command("query")
    .description(
      "fetch/read a heap snapshot and output the matching objects in JSON"
    )
    .option("-u, --url <url>")
    .option(
      "-d, --depth <value>",
      "recursion search depth",
      toNumberOrIfinity,
      Infinity
    )
    .option(
      "-e, --exclude <...nodeNames>",
      "name of nodes (case-sensitive) to be excluded from building graph",
      castProperties
    )
    .option("-f, --filepath <filepath>", "filepath", relativeFilepath)
    .requiredOption(
      "-p, --properties <...props>",
      "properties of the object",
      castProperties
    )
    .option(
      "-i, --ignore-properties <...props>",
      "ignore properties on object",
      castProperties
    )
    .action(querySnapshotCommand);

  program.hook("preAction", () => {
    if (program.opts().debug) {
      info(">> Debug mode enabled");
      enableDebugLogging();
    }
  });

  program.parseAsync(process.argv).catch((err) => {
    // eslint-disable-next-line
    console.error(err);
    process.exit(1);
  });
}

async function writeHeapSnapshotCommand({
  url,
  output,
}: {
  url: string;
  output: string;
}) {
  info(`Fetching remote snapshot: ${url}`);
  const heapSnapshot = await fetchRemoteHeapSnapshot(url);

  info(">> Writing heap snapshot to", output);
  await writeHeapSnapshot(output, heapSnapshot);
}

async function querySnapshotCommand({
  url,
  filepath,
  properties,
  ignoreProperties,
  exclude,
  depth,
}: {
  url?: string;
  filepath?: string;
  properties: string[];
  ignoreProperties?: string[];
  exclude?: string[];
  depth?: number;
}) {
  if (!url && !filepath) {
    throw new Error(`Please specify a URL or a snapshot filepath`);
  }

  const heapSnapshot = url
    ? await fetchRemoteHeapSnapshot(url)
    : await readHeapSnapshot(filepath!);

  log(
    JSON.stringify(
      findObjectsWithProperties(heapSnapshot, properties, {
        ignoreProperties,
        maxDepth: depth,
        unwantedNodeNames: exclude,
      }),
      null,
      2
    )
  );
}

async function fetchRemoteHeapSnapshot(url: string): Promise<HeapSnapshot> {
  return await withPage(async (page) => {
    info(`>> Opening Puppeteer page at: ${url}`);
    await page.goto(url);

    const wait = parseInt(program.opts().wait, 10);
    await new Promise((resolve) => setTimeout(resolve, wait));

    info(">> Taking heap snapshot..");
    return await captureHeapSnapshot(await page.target());
  });
}

export async function withBrowser<T>(
  callback: (browser: Browser) => Promise<T>
): Promise<T> {
  const browser = await Puppeteer.launch({
    headless: program.opts().headless,
  });

  try {
    return await callback(browser);
  } finally {
    await browser.close();
  }
}

export async function withPage<T>(
  callback: (page: Page, browser: Browser) => Promise<T>
): Promise<T> {
  return await withBrowser(async (browser) => {
    const page = await browser.newPage();

    try {
      return await callback(page, browser);
    } finally {
      await page.close();
    }
  });
}

function relativeFilepath(filepath: string) {
  return path.resolve(process.cwd(), filepath);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function info(...args: any[]) {
  console.error(...args);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function log(...args: any[]) {
  console.log(...args);
}
