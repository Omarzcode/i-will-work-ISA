"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

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
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 bg-white border-0 overflow-auto">
        <div className="relative">
          {/* Close button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="absolute top-2 right-2 z-50 bg-white/80 hover:bg-white rounded-full w-8 h-8 p-0 shadow-md"
          >
            <X className="w-4 h-4" />
          </Button>

          {/* Image at actual size */}
          <img
            src={src || "/placeholder.svg"}
            alt={alt}
            className="block max-w-[95vw] max-h-[95vh] object-contain"
            style={{ width: "auto", height: "auto" }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
