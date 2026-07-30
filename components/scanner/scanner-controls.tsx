'use client'

import { Camera, X, Scan, Loader2 } from 'lucide-react'

interface ScannerControlsProps {
  isActive: boolean
  isScanning: boolean
  isLoading: boolean
  detectionCount: number
  onStartCamera: () => void
  onStopCamera: () => void
  onToggleScan: () => void
  onFindRecipes: () => void
}

export function ScannerControls({
  isActive,
  isScanning,
  isLoading,
  detectionCount,
  onStartCamera,
  onStopCamera,
  onToggleScan,
  onFindRecipes
}: ScannerControlsProps) {
  if (!isActive) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-background/95 backdrop-blur-sm">
        <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
          <Camera className="w-12 h-12 text-primary" />
        </div>
        <div className="text-center px-8">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Scan Your Ingredients
          </h2>
          <p className="text-muted-foreground text-sm">
            Point your camera at ingredients to discover Filipino recipes you can make
          </p>
        </div>
        <button
          onClick={onStartCamera}
          className="px-8 py-4 bg-primary text-primary-foreground rounded-full font-medium text-lg flex items-center gap-2 hover:bg-primary/90 transition-colors"
        >
          <Camera className="w-5 h-5" />
          Start Camera
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 safe-area-top px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center justify-between">
          <h1 className="text-white font-semibold text-lg">Lutong Bahay</h1>
          <button
            onClick={onStopCamera}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Status indicator */}
      {isLoading && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
          <span className="text-white text-sm">Loading AI model...</span>
        </div>
      )}

      {/* Detection count badge */}
      {detectionCount > 0 && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground rounded-full px-4 py-2">
          <span className="font-medium">{detectionCount} ingredient{detectionCount !== 1 ? 's' : ''} detected</span>
        </div>
      )}

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 safe-area-bottom px-4 py-6 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-center gap-4">
          {/* Scan button */}
          <button
            onClick={onToggleScan}
            disabled={isLoading}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
              isScanning
                ? 'bg-primary text-primary-foreground scale-110'
                : 'bg-white/20 backdrop-blur-sm text-white'
            } ${isLoading ? 'opacity-50' : ''}`}
          >
            {isScanning ? (
              <div className="relative">
                <Scan className="w-8 h-8" />
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap">
                  Scanning...
                </span>
              </div>
            ) : (
              <Scan className="w-8 h-8" />
            )}
          </button>

          {/* Find recipes button */}
          {detectionCount > 0 && (
            <button
              onClick={onFindRecipes}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium flex items-center gap-2 animate-in slide-in-from-right"
            >
              Find Recipes
              <span className="bg-primary-foreground/20 rounded-full px-2 py-0.5 text-sm">
                {detectionCount}
              </span>
            </button>
          )}
        </div>
      </div>
    </>
  )
}
