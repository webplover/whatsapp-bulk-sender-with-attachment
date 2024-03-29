import puppeteer from "puppeteer-core";
import getSheetData from "./modules/get-sheet-data.js";
import { existsSync } from "fs";
import { appendFile, readFile } from "fs/promises";

const delay = (ms) => new Promise((res) => setTimeout(res, ms));
const sheet_data = getSheetData("data/results.xlsx");

(async () => {
  // Logs array
  const logs = await readFile("data/logs.txt", "utf-8");
  const logs_array = logs
    .split(/\r?\n/)
    .filter((line) => line.length > 0)
    .map((el) => Number(el));

  const browser = await puppeteer.connect({
    browserURL: "http://127.0.0.1:9222/",
    defaultViewport: null,
  });

  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(300000); // 5 minutes

  for (let row of sheet_data) {
    // column names (columns structure)
    let { roll_number, name, f_name, phone, msg } = row;
    let attachment = existsSync(`data/reports/${roll_number}.pdf`)
      ? `data/reports/${roll_number}.pdf`
      : null;

    // msg = encodeURIComponent(msg);

    // add faild roll_number to 'failed.txt'
    if (!attachment) {
      await appendFile("data/failed.txt", roll_number + "\r\n");
    }

    if (!logs_array.includes(roll_number) && attachment) {
      await page.goto(
        `https://web.whatsapp.com/send/?phone=${phone}&text=${msg}`,
        {
          waitUntil: "load",
        }
      );

      // select attachment
      let attachment_btn = '[aria-label="Attach"]';
      let upload_btn = '[data-testid="attach-document"]';

      await page.waitForSelector(attachment_btn);
      await delay(1000);
      await page.click(attachment_btn);
      await page.waitForSelector(upload_btn);

      const [filechooser] = await Promise.all([
        page.waitForFileChooser(),
        page.click(upload_btn),
      ]);

      filechooser.accept([attachment]);

      //   click on send btn
      let send_btn = '[role="button"][aria-label="Send"]';
      await page.waitForSelector(send_btn);
      await delay(1000);
      await page.click(send_btn);

      // wait for upload completion
      /*
      let audio_cancel_btn = '[data-testid="audio-cancel-noborder"]';

      await delay(2000);
      try {
        await page.waitForSelector(audio_cancel_btn);

        await page.waitForSelector(audio_cancel_btn, {
          hidden: true,
        });
      } catch (e) {}
      */

      await delay(1000 * 10);

      // update logs
      await appendFile("data/logs.txt", roll_number + "\r\n");
    }
  }
  //   Disconnect the browser at the end
  browser.disconnect();
})();
