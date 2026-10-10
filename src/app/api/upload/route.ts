import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { createNovel } from "@/lib/models/novels";
import { createManyChapters } from "@/lib/models/chapters";
import {
  splitNovelIntoChapters,
  extractTitle,
} from "@/lib/textProcessor";
import { decodeTextBuffer } from "@/lib/encoding";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // 2 minutes for large novel files up to 50MB

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || "52428800", 10); // 50MB default

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const customTitle = formData.get("title") as string | null;
    const encodingParam = (formData.get("encoding") as string) || "auto";
    const wordsPerChapterRaw = formData.get("wordsPerChapter") as string | null;
    const wordsPerChapter = wordsPerChapterRaw
      ? Math.max(100, Math.min(50000, parseInt(wordsPerChapterRaw, 10)))
      : 2000;
    const forceWordSplitRaw = formData.get("forceWordSplit") as string | null;
    const forceWordSplit = forceWordSplitRaw === "true";
    const headingPreset = (formData.get("headingPreset") as any) || "auto";
    const customPattern = (formData.get("customPattern") as string) || "";

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith(".txt") && file.type !== "text/plain") {
      return NextResponse.json(
        { success: false, message: "Only TXT files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: `File size exceeds maximum allowed (${
            MAX_FILE_SIZE / 1024 / 1024
          }MB)`,
        },
        { status: 400 }
      );
    }

    // Read and decode file buffer with auto-encoding detection (supports GBK, GB18030, Big5, Shift-JIS, etc.)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const { text, encoding } = decodeTextBuffer(buffer, encodingParam);

    if (!text.trim()) {
      return NextResponse.json(
        { success: false, message: "File is empty or could not be decoded" },
        { status: 400 }
      );
    }

    // Extract title from filename or text
    const title = customTitle || extractTitle(text, file.name);

    // Split into chapters
    const processedChapters = splitNovelIntoChapters(
      text,
      wordsPerChapter,
      forceWordSplit,
      headingPreset,
      customPattern
    );

    if (processedChapters.length === 0) {
      return NextResponse.json(
        { success: false, message: "Could not extract any content from file" },
        { status: 400 }
      );
    }

    // Calculate total word count
    const totalWords = processedChapters.reduce(
      (sum, ch) => sum + ch.wordCount,
      0
    );

    // Create novel document
    const novel = await createNovel({
      name: title,
      totalChapters: processedChapters.length,
      totalWords,
    });

    // Create chapter documents
    const chapters = processedChapters.map((ch, index) => ({
      novelId: novel._id as ObjectId,
      name: ch.title || `Chapter ${index + 1}`,
      chap: index + 1,
      content: ch.content,
      wordCount: ch.wordCount,
    }));

    await createManyChapters(chapters);

    return NextResponse.json({
      success: true,
      novelId: novel._id.toString(),
      message: `Successfully created novel with ${processedChapters.length} chapters (${encoding.toUpperCase()})`,
      data: {
        title: novel.name,
        totalChapters: novel.totalChapters,
        totalWords: novel.totalWords,
        encoding,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process file. Please try again." },
      { status: 500 }
    );
  }
}
