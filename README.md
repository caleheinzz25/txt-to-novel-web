# NovelReader - TXT to Novel Web Application

A full-stack web application built with Next.js 14+ that allows users to upload TXT novel files, automatically split them into chapters (8000 words per chapter), and read them in a beautiful, distraction-free reader interface.

## Features

- 📤 **Drag & Drop Upload**: Upload TXT files with drag-and-drop support
- ✂️ **Smart Chapter Splitting**: Automatically splits novels into ~8000 word chapters with sentence boundary detection
- 📚 **Novel Library**: View all uploaded novels in a beautiful card grid
- 🔍 **Search & Filter**: Search novels by title and sort by date, chapters, or words
- 📖 **Clean Reader Interface**: Distraction-free reading experience
- 🌙 **Dark/Light Mode**: Toggle between themes, persisted in localStorage
- 🔤 **Font Size Control**: Adjust reading font size
- 📱 **Responsive Design**: Works on desktop and mobile devices
- ⏩ **Chapter Navigation**: Easy prev/next navigation with chapter list sidebar

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: CSS Custom Properties with dark/light theme support
- **Database**: MongoDB
- **File Upload**: react-dropzone
- **Icons**: lucide-react

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- MongoDB database (local or MongoDB Atlas)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd txt-to-novel-web
```

2. Install dependencies:

```bash
bun install
# or
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

4. Edit `.env.local` with your MongoDB connection string:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/noveldb?retryWrites=true&w=majority
MAX_FILE_SIZE=10485760
```

5. Run the development server:

```bash
bun dev
# or
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

| Method | Endpoint                     | Description                                                       |
| ------ | ---------------------------- | ----------------------------------------------------------------- |
| POST   | `/api/upload`                | Upload and process a TXT novel file                               |
| GET    | `/api/novels`                | List all novels (supports `search`, `sortBy`, `sortOrder` params) |
| GET    | `/api/novels/[id]`           | Get novel details with chapter list                               |
| DELETE | `/api/novels/[id]`           | Delete a novel and all its chapters                               |
| GET    | `/api/chapters?novelId=[id]` | List chapters for a novel                                         |
| GET    | `/api/chapters/[id]`         | Get chapter content with navigation                               |

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── upload/route.ts
│   │   ├── novels/route.ts
│   │   ├── novels/[id]/route.ts
│   │   ├── chapters/route.ts
│   │   └── chapters/[id]/route.ts
│   ├── novel/
│   │   └── [id]/
│   │       ├── page.tsx
│   │       └── chapter/[chapterId]/page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ChapterList.tsx
│   ├── FileUpload.tsx
│   ├── NovelCard.tsx
│   ├── ReaderControls.tsx
│   ├── SearchBar.tsx
│   └── ThemeProvider.tsx
└── lib/
    ├── models/
    │   ├── chapters.ts
    │   └── novels.ts
    ├── mongodb.ts
    └── textProcessor.ts
```

## Usage

1. **Upload a Novel**: Drag and drop a TXT file onto the upload area, or click to select a file
2. **Browse Library**: View your uploaded novels in the grid, use search to find specific titles
3. **Read**: Click on a novel card to view its chapters, then click "Start Reading" or select a chapter
4. **Customize Reading**: Toggle dark/light mode, adjust font size, and navigate between chapters

## Testing

For testing, you can use public domain novels from [Project Gutenberg](https://www.gutenberg.org/) in TXT format.

## License

MIT
