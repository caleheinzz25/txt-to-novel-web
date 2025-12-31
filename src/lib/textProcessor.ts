export interface ProcessedChapter {
  content: string;
  wordCount: number;
}

/**
 * Split novel text into chapters of approximately wordsPerChapter words.
 * Preserves newlines and paragraph structure.
 */
export function splitNovelIntoChapters(
  text: string,
  wordsPerChapter: number = 2000
): ProcessedChapter[] {
  // Normalize line endings but preserve newlines
  const normalizedText = text.replace(/\r\n/g, "\n").trim();

  if (!normalizedText) {
    return [];
  }

  // Split into paragraphs (by double newlines or single newlines)
  const paragraphs = normalizedText.split(/\n/).map((p) => p.trim());

  const chapters: ProcessedChapter[] = [];
  let currentChapterParagraphs: string[] = [];
  let currentWordCount = 0;

  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i];
    const paragraphWordCount = paragraph
      .split(/\s+/)
      .filter((w) => w.length > 0).length;

    // If adding this paragraph exceeds the limit and we have content,
    // try to find a good breaking point
    if (
      currentWordCount + paragraphWordCount > wordsPerChapter &&
      currentChapterParagraphs.length > 0
    ) {
      // Look for sentence ending in current content to make a clean break
      // Save current chapter
      chapters.push({
        content: currentChapterParagraphs.join("\n"),
        wordCount: currentWordCount,
      });

      // Start new chapter
      currentChapterParagraphs = [];
      currentWordCount = 0;
    }

    // Add paragraph to current chapter (even empty lines for spacing)
    currentChapterParagraphs.push(paragraph);
    currentWordCount += paragraphWordCount;
  }

  // Don't forget the last chapter
  if (currentChapterParagraphs.length > 0) {
    chapters.push({
      content: currentChapterParagraphs.join("\n"),
      wordCount: currentWordCount,
    });
  }

  return chapters;
}

/**
 * Count words in a text string.
 */
export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

/**
 * Extract suggested title from text (first line or first few words).
 */
export function extractTitle(text: string, filename: string): string {
  // First try to get from filename (remove .txt extension)
  const filenameTitle = filename.replace(/\.txt$/i, "").trim();

  if (
    filenameTitle &&
    filenameTitle.length > 0 &&
    filenameTitle.length <= 100
  ) {
    return filenameTitle;
  }

  // Otherwise try first non-empty line of text
  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    // Use first line if it's a reasonable title length
    if (firstLine.length <= 100) {
      return firstLine;
    }
    // Otherwise use first few words
    return firstLine.split(/\s+/).slice(0, 10).join(" ") + "...";
  }

  return "Untitled Novel";
}
