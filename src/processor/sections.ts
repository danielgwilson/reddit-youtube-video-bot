import { IPost, IPostSection, IPostComment, IGildings } from "../types";
import VoiceOverClient from "./voice-over";
import { getFragments, getAudioLengthForFragments } from "./fragments";
import { getCleanText } from "./util/clean-text";

export async function getSections(
  post: IPost,
  voiceOverClient: VoiceOverClient,
  outputDir: string,
  options: { speakingRate?: number } = {}
) {
  const { speakingRate } = options;

  const sections = await Promise.all([
    getSectionForTitle(
      {
        text: post.details.title,
        author: post.details.author,
        score: post.details.score,
        gildings: post.details.gildings,
      },
      {
        voiceOverClient,
        fileNamePrefix: `${post.id}-${0}`,
        outputDir,
        speakingRate,
      }
    ),
    ...post.comments.map((comment, i) => {
      return getSectionForComment(comment, {
        voiceOverClient,
        fileNamePrefix: `${post.id}-${i + 1}`,
        outputDir,
        speakingRate,
      });
    }),
  ]);

  return sections;
}

async function getSectionForTitle(
  {
    text,
    score,
    author,
    gildings,
  }: { text: string; score: number; author: string; gildings: IGildings },
  {
    voiceOverClient,
    fileNamePrefix,
    outputDir,
    speakingRate,
  }: {
    voiceOverClient: VoiceOverClient;
    fileNamePrefix: string;
    outputDir: string;
    speakingRate?: number;
  }
): Promise<IPostSection> {
  const fragments = await getFragments({
    text: getCleanText(text),
    voiceOverClient,
    fileNamePrefix,
    outputDir,
    splitBySentence: false,
    speakingRate,
  });
  return {
    type: "title",
    fragments,
    length: getAudioLengthForFragments(fragments),

    score,
    author,
    gildings,

    children: [],
  } as IPostSection;
}

async function getSectionForComment(
  { body, score, author, gildings, replies }: IPostComment,
  {
    voiceOverClient,
    outputDir,
    fileNamePrefix,
    speakingRate,
  }: {
    voiceOverClient: VoiceOverClient;
    outputDir: string;
    fileNamePrefix: string;
    speakingRate?: number;
  }
): Promise<IPostSection> {
  const fragments = await getFragments({
    text: getCleanText(body),
    voiceOverClient,
    fileNamePrefix,
    outputDir,
    splitBySentence: true,
    speakingRate,
  });
  return {
    type: "comment",
    fragments,
    length: getAudioLengthForFragments(fragments),

    score,
    author,
    gildings,

    children: await Promise.all(
      replies.map((reply, i) =>
        getSectionForComment(reply, {
          voiceOverClient,
          outputDir,
          fileNamePrefix: `${fileNamePrefix}-${i}`,
        })
      )
    ),
  } as IPostSection;
}

export function getCharacters(sections: IPostSection[]) {
  return sections
    .map((section) =>
      section.fragments
        .map((fragment) => fragment.text.length)
        .reduce((a, b) => a + b, 0)
    )
    .reduce((a, b) => a + b, 0);
}

export function getAudioLengthForSections(sections: IPostSection[]): number {
  return sections
    .map((section) => {
      const childLength = getAudioLengthForSections(section.children);
      return section.length + childLength;
    })
    .reduce((a, b) => a + b, 0);
}
