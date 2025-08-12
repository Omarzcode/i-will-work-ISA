"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, ZoomIn, ZoomOut, RotateCw, Download, Maximize2 } from "lucide-react"

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
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, posX: 0, posY: 0 })
  const [rotation, setRotation] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setScale(1)
      setPosition({ x: 0, y: 0 })
      setRotation(0)
      setIsDragging(false)
    }
  }, [isOpen])

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev * 1.5, 4))
  }

  const handleZoomOut = () => {
    setScale((prev) => {
      const newScale = Math.max(prev / 1.5, 0.5)
      if (newScale <= 1) {
        setPosition({ x: 0, y: 0 })
      }
      return newScale
    })
  }

  const handleFitToScreen = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(src)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = alt || "image"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Download failed:", error)
    }
  }

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      e.preventDefault()
      setIsDragging(true)
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        posX: position.x,
        posY: position.y,
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      setPosition({
        x: dragStart.posX + deltaX,
        y: dragStart.posY + deltaY,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && scale > 1) {
      const touch = e.touches[0]
      setIsDragging(true)
      setDragStart({
        x: touch.clientX,
        y: touch.clientY,
        posX: position.x,
        posY: position.y,
      })
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1 && scale > 1) {
      e.preventDefault()
      const touch = e.touches[0]
      const deltaX = touch.clientX - dragStart.x
      const deltaY = touch.clientY - dragStart.y
      setPosition({
        x: dragStart.posX + deltaX,
        y: dragStart.posY + deltaY,
      })
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  // Double tap to zoom
  const handleDoubleClick = () => {
    if (scale === 1) {
      setScale(2)
    } else {
      setScale(1)
      setPosition({ x: 0, y: 0 })
    }
  }

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.min(Math.max(scale * delta, 0.5), 4)

    if (newScale <= 1) {
      setScale(1)
      setPosition({ x: 0, y: 0 })
    } else {
      setScale(newScale)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[100vw] max-h-[100vh] w-full h-full p-0 bg-black border-0 overflow-hidden">
        <div className="relative w-full h-full flex flex-col">
          {/* Header with controls */}
          <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-4">
            <div className="flex items-center justify-between">
              <div className="text-white text-sm font-medium truncate max-w-[60%]">{alt}</div>
              <div className="flex items-center gap-2">
                {/* Desktop controls */}
                <div className="hidden sm:flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleZoomOut}
                    className="text-white hover:bg-white/20 h-9 w-9 p-0"
                    disabled={scale <= 0.5}
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <div className="text-white text-sm font-medium min-w-[50px] text-center">
                    {Math.round(scale * 100)}%
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleZoomIn}
                    className="text-white hover:bg-white/20 h-9 w-9 p-0"
                    disabled={scale >= 4}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleFitToScreen}
                    className="text-white hover:bg-white/20 h-9 w-9 p-0"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRotate}
                    className="text-white hover:bg-white/20 h-9 w-9 p-0"
                  >
                    <RotateCw className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDownload}
                    className="text-white hover:bg-white/20 h-9 w-9 p-0"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onClose}
                  className="text-white hover:bg-white/20 h-9 w-9 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Image container */}
          <div
            ref={containerRef}
            className="flex-1 flex items-center justify-center overflow-hidden select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onDoubleClick={handleDoubleClick}
            onWheel={handleWheel}
            style={{
              cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default",
            }}
          >
            <img
              ref={imageRef}
              src={src || "/placeholder.svg"}
              alt={alt}
              className="max-w-none max-h-none object-contain"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                transition: isDragging ? "none" : "transform 0.3s ease-out",
                maxWidth: scale === 1 ? "100%" : "none",
                maxHeight: scale === 1 ? "100%" : "none",
              }}
              draggable={false}
            />
          </div>

          {/* Mobile controls */}
          <div className="sm:hidden absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center justify-center gap-4">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleZoomOut}
                className="text-white hover:bg-white/20 h-12 w-12 p-0 rounded-full"
                disabled={scale <= 0.5}
              >
                <ZoomOut className="w-5 h-5" />
              </Button>
              <div className="text-white text-sm font-medium min-w-[60px] text-center bg-white/20 px-3 py-2 rounded-full">
                {Math.round(scale * 100)}%
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleZoomIn}
                className="text-white hover:bg-white/20 h-12 w-12 p-0 rounded-full"
                disabled={scale >= 4}
              >
                <ZoomIn className="w-5 h-5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleFitToScreen}
                className="text-white hover:bg-white/20 h-12 w-12 p-0 rounded-full"
              >
                <Maximize2 className="w-5 h-5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRotate}
                className="text-white hover:bg-white/20 h-12 w-12 p-0 rounded-full"
              >
                <RotateCw className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="absolute bottom-20 sm:bottom-4 left-1/2 transform -translate-x-1/2 z-40 pointer-events-none">
            <div className="bg-black/60 text-white px-4 py-2 rounded-full text-sm text-center backdrop-blur-sm">
              <div className="hidden sm:block">Double-click or scroll to zoom • Drag to move when zoomed</div>
              <div className="sm:hidden">Double-tap to zoom • Drag to move when zoomed</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
