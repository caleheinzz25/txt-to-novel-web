import { NextRequest, NextResponse } from "next/server";
import { getAllNovels } from "@/lib/models/novels";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || undefined;
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as
      | "asc"
      | "desc";

    const novels = await getAllNovels(search, sortBy, sortOrder);

    return NextResponse.json({
      success: true,
      data: novels.map((novel) => ({
        _id: novel._id.toString(),
        name: novel.name,
        totalChapters: novel.totalChapters,
        totalWords: novel.totalWords,
        createdAt: novel.createdAt,
        updatedAt: novel.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching novels:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch novels" },
      { status: 500 }
    );
  }
}
