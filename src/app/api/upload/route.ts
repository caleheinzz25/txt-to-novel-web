import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { createNovel } from "@/lib/models/novels";
import { createManyChapters } from "@/lib/models/chapters";
import {
  splitNovelIntoChapters,
  countWords,
  extractTitle,
} from "@/lib/textProcessor";

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || "10485760", 10); // 10MB default

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const customTitle = formData.get("title") as string | null;

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

    // Read file content
    const text = await file.text();

    if (!text.trim()) {
      return NextResponse.json(
        { success: false, message: "File is empty" },
        { status: 400 }
      );
    }

    // Extract title from filename or text
    const title = customTitle || extractTitle(text, file.name);

    // Split into chapters
    const processedChapters = splitNovelIntoChapters(text,2000);

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
      name: `Chapter ${index + 1}`,
      chap: index + 1,
      content: ch.content,
      wordCount: ch.wordCount,
    }));

    await createManyChapters(chapters);

    return NextResponse.json({
      success: true,
      novelId: novel._id.toString(),
      message: `Successfully created novel with ${processedChapters.length} chapters`,
      data: {
        title: novel.name,
        totalChapters: novel.totalChapters,
        totalWords: novel.totalWords,
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
