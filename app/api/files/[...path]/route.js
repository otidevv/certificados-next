import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

const MIME_TYPES = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  ico: "image/x-icon",
}

export async function GET(request, { params }) {
  const { path } = await params
  const filePath = join(process.cwd(), "public", "uploads", ...path)

  // Security: prevent path traversal
  const resolved = join(process.cwd(), "public", "uploads")
  if (!filePath.startsWith(resolved)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  try {
    const buffer = await readFile(filePath)
    const ext = filePath.split(".").pop().toLowerCase()
    const contentType = MIME_TYPES[ext] || "application/octet-stream"

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch {
    return NextResponse.json({ error: "Error reading file" }, { status: 500 })
  }
}
