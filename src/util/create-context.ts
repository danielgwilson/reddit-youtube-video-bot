import fs from "fs";
import { IContext } from "../types";

export function createContext({
  outputDir = "./temp/",
  resourceDir = "./resources/",
  saveOutputToFile = true,
  debug = false
}: {
  outputDir?: string;
  resourceDir?: string;
  saveOutputToFile?: boolean;
  debug?: boolean;
} = {}) {
  const outputDirPath = outputDir;
  // const outputDirPath = path.join(__dirname, "/../", "/../", outputDir);
  if (!fs.existsSync(outputDirPath)) {
    fs.mkdirSync(outputDirPath);
  }
  const resourceDirPath = resourceDir;
  // const resourceDirPath = path.join(__dirname, "/../", "/../", resourceDir);
  if (!fs.existsSync(resourceDirPath)) {
    fs.mkdirSync(resourceDirPath);
  }

  return {
    outputDir: outputDirPath,
    resourceDir: resourceDirPath,
    saveOutputToFile,
    debug
  } as IContext;
}