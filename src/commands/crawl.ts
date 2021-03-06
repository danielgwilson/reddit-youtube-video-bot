import Command, { flags } from "@oclif/command";
import { contextFlags } from "../flags/context-flags";
import { createContext, notify, logPost } from "../util";
import Crawler from "../crawler";
import { IPost } from "../types";

export class CrawlCommand extends Command {
  static description = `
    crawls a reddit post with a given index and subreddit name
  `;

  static flags = {
    ...contextFlags,
    postId: flags.string({
      char: "p",
      description: "id of the post to be crawled",
      hidden: false,
      multiple: true,
      required: false,
    }),
    postUri: flags.string({
      char: "u",
      description: "uri of the post or comment to be crawled",
      hidden: false,
      multiple: true,
      required: false,
    }),
    subredditName: flags.string({
      char: "n",
      description: "name of the subreddit to be crawled", // help description for flag
      hidden: false, // hide from help
      multiple: false, // allow setting this flag multiple times
      default: "AskReddit", // default value if flag not passed (can be a function that returns a string or undefined)
      exclusive: ["postId"],
      required: false, // make flag required (this is not common and you should probably use an argument instead)
    }),
    postIndex: flags.integer({
      char: "i",
      description: "index of the post to be crawled", // help description for flag
      hidden: false, // hide from help
      multiple: false, // allow setting this flag multiple times
      default: 0, // default value if flag not passed (can be a function that returns a string or undefined)
      required: false, // make flag required (this is not common and you should probably use an argument instead)
    }),
    nPosts: flags.integer({
      char: "N",
      description: "number of posts to crawl", // help description for flag
      hidden: false, // hide from help
      multiple: false, // allow setting this flag multiple times
      default: 1, // default value if flag not passed (can be a function that returns a string or undefined)
      required: false, // make flag required (this is not common and you should probably use an argument instead)
    }),
    minWords: flags.integer({
      char: "w",
      description: "minimum number of words to return", // help description for flag
      hidden: false, // hide from help
      multiple: false, // allow setting this flag multiple times
      default: 2.6 * 60 * 20, // default value if flag not passed (can be a function that returns a string or undefined)
      required: false, // make flag required (this is not common and you should probably use an argument instead)
    }),
    maxReplyDepth: flags.integer({
      char: "d",
      description:
        "maximum number of subcomments to return for each top-level comment", // help description for flag
      hidden: false, // hide from help
      multiple: false, // allow setting this flag multiple times
      default: 2, // default value if flag not passed (can be a function that returns a string or undefined)
      required: false, // make flag required (this is not common and you should probably use an argument instead)
    }),
    maxRepliesPerComment: flags.integer({
      char: "r",
      description:
        "maximum number of direct replies to return for each comment (not including sub-replies)", // help description for flag
      hidden: false, // hide from help
      multiple: false, // allow setting this flag multiple times
      default: 2, // default value if flag not passed (can be a function that returns a string or undefined)
      required: false, // make flag required (this is not common and you should probably use an argument instead)
    }),
    top: flags.string({
      char: "t",
      description: "sort subreddit posts by top (of time period)", // help description for flag
      hidden: false, // hide from help
      multiple: false, // allow setting this flag multiple times
      required: false, // make flag required (this is not common and you should probably use an argument instead)
      options: ["hour", "day", "week", "month", "year", "all"],
    }),
  };

  async run() {
    const { flags } = this.parse(CrawlCommand);
    const {
      outputDir,
      resourceDir,
      saveOutputToFile,
      debug,
      postId,
      postUri,
      subredditName,
      postIndex,
      nPosts,
      top,
    } = flags;

    const context = createContext({
      outputDir,
      resourceDir,
      saveOutputToFile,
      debug,
    });

    const sort:
      | { type: "hot" }
      | {
          type: "top";
          time: "week" | "hour" | "day" | "month" | "year" | "all";
        } = top
      ? {
          type: "top",
          time: top as "week" | "hour" | "day" | "month" | "year" | "all",
        }
      : { type: "hot" };

    notify(`Started crawling post at ${new Date().toLocaleTimeString()}`);

    const crawler = new Crawler(context);

    const promises: Promise<IPost>[] = [];

    if (postId && postId.length > 0) {
      promises.push(
        ...postId.map(async (id) => {
          const post = await crawler.getPost({
            postId: id,
            sort,
          });
          logPost(post);
          return post;
        })
      );
    }

    if (postUri && postUri.length > 0) {
      promises.push(
        ...postUri.map(async (uri) => {
          const post = await crawler.getPost({
            postUri: uri,
            sort,
          });
          logPost(post);
          return post;
        })
      );
    }

    if (promises.length === 0) {
      promises.push(
        new Promise(async (resolve) => {
          const posts = await crawler.getPostsFromSubreddit({
            subredditName,
            postIndex: postIndex,
            nPosts: nPosts,
            sort,
          });
          posts.map((post) => logPost(post));
          return resolve(...posts);
        })
      );
    }
    await Promise.all(promises);

    notify(
      `Finished! Crawling completed at at ${new Date().toLocaleTimeString()}`
    );
  }
}
