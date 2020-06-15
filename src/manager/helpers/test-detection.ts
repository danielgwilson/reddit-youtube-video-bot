import path from "path";
import Manager from "../manager";

export async function testDetection(manager: Manager) {
  console.log("Running tests...");

  // Must create a new page; old pages are not correctly stealthed.
  const page = await manager.newPage();
  await page.setDefaultNavigationTimeout(0);

  await page.goto("https://bot.sannysoft.com");
  await page.waitFor(5000);
  await page.screenshot({
    path: `${path.join(manager.context.outputDir, "testresult.png")}`,
    fullPage: true,
  });

  await page.goto("http://lumtest.com/myip.json");
  await page.waitFor(5000);
  await page.screenshot({
    path: `${path.join(manager.context.outputDir, "ipresult.png")}`,
    fullPage: true,
  });

  // Also consider running test from https://arh.antoinevastel.com/bots/areyouheadless

  console.log(`All done, check the screenshot. ✨`);
}