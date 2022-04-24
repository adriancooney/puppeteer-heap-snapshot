import { Browser, Page } from "puppeteer";
import * as Puppeteer from "puppeteer";

export function setupBrowser() {
  let browser: Browser;

  beforeAll(async () => {
    browser = await Puppeteer.launch();
  });

  afterAll(async () => {
    await browser.close();
  });

  function getBrowser() {
    return browser;
  }

  async function withPage<T>(callback: (page: Page) => Promise<T>): Promise<T> {
    const page = await browser.newPage();

    try {
      return await callback(page);
    } finally {
      await page.close();
    }
  }

  return {
    getBrowser,
    withPage,
  };
}
