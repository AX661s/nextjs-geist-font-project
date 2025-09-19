'use client'

import { useState, useCallback } from 'react'

interface UploadedFile {
  name: string
  size: number
  type: string
  url?: string
}

export default function HomePage() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleFileSelect = useCallback(async (selectedFiles: FileList) => {
    if (!selectedFiles || selectedFiles.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)

    const formData = new FormData()
    Array.from(selectedFiles).forEach((file) => {
      formData.append('files', file)
    })

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        const newFiles: UploadedFile[] = result.files.map((file: any) => ({
          name: file.name,
          size: file.size,
          type: file.type,
          url: file.url,
        }))
        setFiles((prev) => [...prev, ...newFiles])
        setUploadProgress(100)
      } else {
        console.error('Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = e.dataTransfer.files
    handleFileSelect(droppedFiles)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">文件上传示例</h1>
        <p className="text-lg text-gray-600">支持拖拽上传和点击选择文件</p>
      </div>

      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all
          ${isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById('fileInput')?.click()}
      >
        <input
          id="fileInput"
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
        />
        
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 text-gray-400">
            <svg
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M4 3a2 2 0 00-2 2v1.816a2 2 0 00.402 1.208l1.472 1.964A2 2 0 005.344 11H8.5a.5.5 0 010 1H5.344a2 2 0 00-1.47 1.012L2.402 15.024A2 2 0 002 16.184V18a2 2 0 002 2h12a2 2 0 002-2v-1.816a2 2 0 00-.402-1.208l-1.472-1.964A2 2 0 0014.656 13H11.5a.5.5 0 010-1h3.156a2 2 0 001.47-1.012l1.472-1.964A2 2 0 0018 7.816V6a2 2 0 00-2-2H4zM9 5a1 1 0 011-1h0a1 1 0 011 1v.5a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5V5z" />
            </svg>
          </div>
          
          <div>
            <p className="text-xl font-semibold text-gray-700">
              {isDragging ? '释放文件进行上传' : '拖拽文件到此处'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              或者 <span className="text-blue-600 underline">点击选择文件</span>
            </p>
          </div>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-lg">
            <div className="text-center">
              <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-blue-500">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                上传中... {uploadProgress}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">已上传的文件</h2>
          <div className="space-y-3">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-white rounded-lg shadow border"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 3a2 2 0 00-2 2v1.816a2 2 0 00.402 1.208l1.472 1.964A2 2 0 005.344 11H8.5a.5.5 0 010 1H5.344a2 2 0 00-1.47 1.012L2.402 15.024A2 2 0 002 16.184V18a2 2 0 002 2h12a2 2 0 002-2v-1.816a2 2 0 00-.402-1.208l-1.472-1.964A2 2 0 0014.656 13H11.5a.5.5 0 010-1h3.156a2 2 0 001.47-1.012l1.472-1.964A2 2 0 0018 7.816V6a2 2 0 00-2-2H4z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(file.size)} • {file.type}
                    </p>
                  </div>
                </div>
                {file.url && (
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    查看
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}