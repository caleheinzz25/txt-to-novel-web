import { NextRequest, NextResponse } from "next/server";
import { getChaptersByNovelId } from "@/lib/models/chapters";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const novelId = searchParams.get("novelId");

    if (!novelId) {
      return NextResponse.json(
        { success: false, message: "novelId parameter is required" },
        { status: 400 }
      );
    }

    const chapters = await getChaptersByNovelId(novelId);

    return NextResponse.json({
      success: true,
      data: chapters.map((ch) => ({
        _id: ch._id.toString(),
        novelId: ch.novelId.toString(),
        name: ch.name,
        chap: ch.chap,
        wordCount: ch.wordCount,
        createdAt: ch.createdAt,
        updatedAt: ch.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching chapters:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch chapters" },
      { status: 500 }
    );
  }
}
