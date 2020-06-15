export interface IUploadOutput {
  id: string;
  dateUploaded: Date;
  context: import("./context").IContext;
  account: string;
  targetDir: string;
  outputName: string;
  videoPath: string;
  caption: string;
  tags: string[];
  manager: {
    proxy;
    executablePath;
    timeout;
  };
}