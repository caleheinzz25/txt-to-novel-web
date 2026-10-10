import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getNovelById, updateNovel } from "@/lib/models/novels";
import {
  getChaptersByNovelId,
  deleteChaptersByNovelId,
  createManyChapters,
} from "@/lib/models/chapters";
import { splitNovelIntoChapters } from "@/lib/textProcessor";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const novel = await getNovelById(id);

    if (!novel) {
      return NextResponse.json(
        { success: false, message: "Novel not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const wordsPerChapter = Math.max(
      100,
      Math.min(50000, parseInt(body.wordsPerChapter || "2000", 10))
    );
    const forceWordSplit =
      body.forceWordSplit !== undefined ? Boolean(body.forceWordSplit) : false;
    const headingPreset = body.headingPreset || "auto";
    const customPattern = body.customPattern || "";

    // Retrieve all existing chapters to reconstruct novel text
    const existingChapters = await getChaptersByNovelId(id, true);

    if (existingChapters.length === 0) {
      return NextResponse.json(
        { success: false, message: "No chapters found to re-split" },
        { status: 400 }
      );
    }

    // Reconstruct full text from existing chapters
    const fullText = existingChapters.map((ch) => ch.content).join("\n\n");

    // Re-split using the new word setting and heading preset
    const processedChapters = splitNovelIntoChapters(
      fullText,
      wordsPerChapter,
      forceWordSplit,
      headingPreset,
      customPattern
    );

    if (processedChapters.length === 0) {
      return NextResponse.json(
        { success: false, message: "Failed to extract chapters from novel" },
        { status: 400 }
      );
    }

    // Delete old chapters
    await deleteChaptersByNovelId(id);

    // Create new chapters
    const newChapters = processedChapters.map((ch, index) => ({
      novelId: novel._id as ObjectId,
      name: ch.title || `Chapter ${index + 1}`,
      chap: index + 1,
      content: ch.content,
      wordCount: ch.wordCount,
    }));

    await createManyChapters(newChapters);

    // Calculate total words and update novel
    const totalWords = processedChapters.reduce(
      (sum, ch) => sum + ch.wordCount,
      0
    );

    await updateNovel(id, {
      totalChapters: processedChapters.length,
      totalWords,
    });

    const updatedChapters = await getChaptersByNovelId(id);
    const chapterList = updatedChapters.map((ch) => ({
      _id: ch._id.toString(),
      name: ch.name,
      chap: ch.chap,
      wordCount: ch.wordCount,
    }));

    return NextResponse.json({
      success: true,
      message: `Successfully re-split novel into ${processedChapters.length} chapters`,
      data: {
        _id: novel._id.toString(),
        name: novel.name,
        totalChapters: processedChapters.length,
        totalWords,
        createdAt: novel.createdAt,
        updatedAt: new Date(),
        chapters: chapterList,
      },
    });
  } catch (error) {
    console.error("Error re-splitting novel:", error);
    return NextResponse.json(
      { success: false, message: "Failed to re-split novel" },
      { status: 500 }
    );
  }
}
