'use client'

import { forwardRef } from 'react'
import type { DetectedIngredient } from '@/lib/types'

interface CameraViewProps {
  isScanning: boolean
  detectedIngredients: DetectedIngredient[]
}

export const CameraView = forwardRef<HTMLVideoElement, CameraViewProps>(
  function CameraView({ isScanning, detectedIngredients }, ref) {
    return (
      <div className="relative w-full h-full bg-black">
        {/* Video element */}
        <video
          ref={ref}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Scanner overlay */}
        {isScanning && (
          <>
            {/* Corner brackets */}
            <div className="absolute inset-8 pointer-events-none">
              {/* Top left */}
              <div className="absolute top-0 left-0 w-12 h-12 border-l-2 border-t-2 border-primary" />
              {/* Top right */}
              <div className="absolute top-0 right-0 w-12 h-12 border-r-2 border-t-2 border-primary" />
              {/* Bottom left */}
              <div className="absolute bottom-0 left-0 w-12 h-12 border-l-2 border-b-2 border-primary" />
              {/* Bottom right */}
              <div className="absolute bottom-0 right-0 w-12 h-12 border-r-2 border-b-2 border-primary" />
            </div>

            {/* Scanning line animation */}
            <div className="absolute inset-8 overflow-hidden pointer-events-none">
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan" />
            </div>
          </>
        )}

        {/* Bounding boxes for detected ingredients */}
        {detectedIngredients.map((detection, index) => (
          <BoundingBoxOverlay
            key={`${detection.ingredient.id}-${index}`}
            detection={detection}
          />
        ))}
      </div>
    )
  }
)

interface BoundingBoxOverlayProps {
  detection: DetectedIngredient
}

function BoundingBoxOverlay({ detection }: BoundingBoxOverlayProps) {
  const { ingredient, confidence, boundingBox } = detection
  
  return (
    <div
      className="absolute border-2 border-primary animate-pulse-border rounded-lg pointer-events-none"
      style={{
        left: `${boundingBox.x}px`,
        top: `${boundingBox.y}px`,
        width: `${boundingBox.width}px`,
        height: `${boundingBox.height}px`,
      }}
    >
      {/* Label */}
      <div className="absolute -top-8 left-0 bg-primary text-primary-foreground px-2 py-1 rounded text-sm font-medium whitespace-nowrap">
        {ingredient.name}
        <span className="ml-1 opacity-75">
          {Math.round(confidence * 100)}%
        </span>
      </div>
    </div>
  )
}
