import fs from "fs";
import { renderThumbnail } from "./render-thumbnail";
import { IContext } from "../../../types";

const context: IContext = {
  outputDir: "./",
  resourceDir: "./resources/",
  saveOutputToFile: true,
  debug: false
};

it("Generate a thumbnail", async () => {
  const title =
    "Would you take a 50/50 chance at $5,000,000 or death? Why or why not?";
  // const title = "Hello world!";
  // const title =
  // "Bank tellers of reddit: What is your plan if someone sends bees through the tube?";
  // const title = "Bank tellers, what if someone sends bees through the tube?";
  // const title =
  // "A new dating app is launched. Instead of a photo of the person, it shows you a photo of their bedroom, car, kitchen, shoes, how they have their tea/coffee, things like that... what photo would tell you the most about someone, and would you be most interested to see to choose a potential date?";
  const thumbnail = await renderThumbnail(title, context);
  const output = fs.existsSync(thumbnail.filePath);
  expect(output).toBeTruthy();
});
