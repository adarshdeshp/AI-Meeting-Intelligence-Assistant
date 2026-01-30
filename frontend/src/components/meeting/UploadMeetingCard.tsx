'use client'

import { useState, useRef, DragEvent } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, FileAudio, X, Loader2 } from 'lucide-react'
import { useMeetingUpload } from '@/hooks/useMeetingUpload'
import { cn } from '@/lib/utils'

const ACCEPTED_FORMATS = ['.mp3', '.wav', '.m4a', '.mp4', '.webm']
const MAX_SIZE_MB = 25
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

export function UploadMeetingCard() {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadMutation = useMeetingUpload()

  const handleDrag = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (file: File) => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ACCEPTED_FORMATS.includes(ext)) {
      alert(`Unsupported format. Accepted: ${ACCEPTED_FORMATS.join(', ')}`)
      return
    }

    if (file.size > MAX_SIZE_BYTES) {
      alert(`File too large. Maximum size: ${MAX_SIZE_MB}MB`)
      return
    }

    setSelectedFile(file)
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''))
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const handleUpload = () => {
    if (!selectedFile) return

    uploadMutation.mutate(
      {
        file: selectedFile,
        title: title || undefined,
      },
      {
        onSuccess: () => {
          // Clear file selection after successful upload to allow new uploads
          setSelectedFile(null)
          setTitle('')
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        },
      }
    )
  }

  const handleClear = () => {
    setSelectedFile(null)
    setTitle('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Meeting Recording</CardTitle>
        <CardDescription>
          Upload audio or video files (MP3, WAV, M4A, MP4, WebM) up to {MAX_SIZE_MB}MB
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Title input (optional) */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Meeting Title (optional)</label>
          <Input
            placeholder="Enter meeting title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={uploadMutation.isPending}
          />
        </div>

        {/* Drag and drop area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors',
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50',
            uploadMutation.isPending && 'opacity-50 pointer-events-none'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_FORMATS.join(',')}
            onChange={handleFileInputChange}
            className="hidden"
            disabled={uploadMutation.isPending}
          />

          {!selectedFile ? (
            <>
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                Drag and drop your file here, or{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-primary hover:underline"
                >
                  browse
                </button>
              </p>
              <p className="text-xs text-muted-foreground">
                Supported formats: {ACCEPTED_FORMATS.join(', ')}
              </p>
            </>
          ) : (
            <div className="space-y-2">
              <FileAudio className="mx-auto h-12 w-12 text-primary mb-4" />
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={uploadMutation.isPending}
              >
                <X className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </div>
          )}
        </div>

        {/* Upload button */}
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || uploadMutation.isPending}
          className="w-full"
        >
          {uploadMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Meeting
            </>
          )}
        </Button>

        {/* Error display */}
        {uploadMutation.isError && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
            <p className="text-sm text-destructive">
              {uploadMutation.error instanceof Error
                ? uploadMutation.error.message
                : 'Upload failed. Please try again.'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
