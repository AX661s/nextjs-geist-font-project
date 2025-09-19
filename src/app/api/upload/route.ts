import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    const uploadedFiles = []

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads')
    try {
      await fs.access(uploadsDir)
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true })
    }

    for (const file of files) {
      if (file.size === 0) {
        continue
      }

      // Generate unique filename
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2, 15)
      const fileExtension = path.extname(file.name)
      const fileName = `${timestamp}-${randomId}${fileExtension}`

      // Read file data
      const arrayBuffer = await file.arrayBuffer()
      const buffer = new Uint8Array(arrayBuffer)

      // Save file
      const filePath = path.join(uploadsDir, fileName)
      await fs.writeFile(filePath, buffer)

      uploadedFiles.push({
        name: file.name,
        size: file.size,
        type: file.type,
        url: `/api/files/${fileName}`,
        fileName: fileName
      })
    }

    return NextResponse.json({
      message: 'Files uploaded successfully',
      files: uploadedFiles
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}