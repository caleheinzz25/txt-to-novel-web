import { NextRequest, NextResponse } from "next/server";
import { getNovelById, deleteNovel } from "@/lib/models/novels";
import {
  getChaptersByNovelId,
  deleteChaptersByNovelId,
} from "@/lib/models/chapters";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const novel = await getNovelById(id);

    if (!novel) {
      return NextResponse.json(
        { success: false, message: "Novel not found" },
        { status: 404 }
      );
    }

    // Get chapters list (without full content for performance)
    const chapters = await getChaptersByNovelId(id);
    const chapterList = chapters.map((ch) => ({
      _id: ch._id.toString(),
      name: ch.name,
      chap: ch.chap,
      wordCount: ch.wordCount,
    }));

    return NextResponse.json({
      success: true,
      data: {
        _id: novel._id.toString(),
        name: novel.name,
        totalChapters: novel.totalChapters,
        totalWords: novel.totalWords,
        createdAt: novel.createdAt,
        updatedAt: novel.updatedAt,
        chapters: chapterList,
      },
    });
  } catch (error) {
    console.error("Error fetching novel:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch novel" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const novel = await getNovelById(id);

    if (!novel) {
      return NextResponse.json(
        { success: false, message: "Novel not found" },
        { status: 404 }
      );
    }

    // Delete all chapters first
    await deleteChaptersByNovelId(id);

    // Delete the novel
    await deleteNovel(id);

    return NextResponse.json({
      success: true,
      message: "Novel and all chapters deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting novel:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete novel" },
      { status: 500 }
    );
  }
}
