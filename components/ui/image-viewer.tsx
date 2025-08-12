"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, ZoomIn, ZoomOut, RotateCw, Download } from "lucide-react"

interface ImageViewerProps {
  src: string
  alt: string
  isOpen: boolean
  onClose: () => void
}

export function ImageViewer({ src, alt, isOpen, onClose }: ImageViewerProps) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [rotation, setRotation] = useState(0)
  const imageRef = useRef<HTMLImageElement>(null)

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setScale(1)
      setPosition({ x: 0, y: 0 })
      setRotation(0)
    }
  }, [isOpen])

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev * 1.5, 5))
  }

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev / 1.5, 0.5))
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = src
    link.download = alt || "image"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (scale > 1 && e.touches.length === 1) {
      setIsDragging(true)
      const touch = e.touches[0]
      setDragStart({
        x: touch.clientX - position.x,
        y: touch.clientY - position.y,
      })
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && scale > 1 && e.touches.length === 1) {
      e.preventDefault()
      const touch = e.touches[0]
      setPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      })
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    if (e.deltaY < 0) {
      handleZoomIn()
    } else {
      handleZoomOut()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/95 border-0">
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Controls */}
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleZoomOut}
              className="bg-white/20 hover:bg-white/30 text-white border-0 rounded-full w-10 h-10 p-0"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleZoomIn}
              className="bg-white/20 hover:bg-white/30 text-white border-0 rounded-full w-10 h-10 p-0"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleRotate}
              className="bg-white/20 hover:bg-white/30 text-white border-0 rounded-full w-10 h-10 p-0"
            >
              <RotateCw className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleDownload}
              className="bg-white/20 hover:bg-white/30 text-white border-0 rounded-full w-10 h-10 p-0"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 text-white border-0 rounded-full w-10 h-10 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Zoom indicator */}
          <div className="absolute top-4 left-4 z-50 bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
            {Math.round(scale * 100)}%
          </div>

          {/* Image container */}
          <div
            className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
          >
            <img
              ref={imageRef}
              src={src || "/placeholder.svg"}
              alt={alt}
              className="max-w-none max-h-none object-contain select-none"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                transition: isDragging ? "none" : "transform 0.2s ease-out",
                cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default",
              }}
              draggable={false}
            />
          </div>

          {/* Instructions */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-white/20 text-white px-4 py-2 rounded-full text-sm text-center">
            <div className="hidden lg:block">Scroll to zoom • Drag to move • Click controls to rotate/download</div>
            <div className="lg:hidden">Pinch to zoom • Drag to move • Tap controls for options</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
