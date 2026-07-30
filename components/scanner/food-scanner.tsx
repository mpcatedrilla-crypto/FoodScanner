'use client'

import { useState, useCallback } from 'react'
import { CameraView } from './camera-view'
import { ScannerControls } from './scanner-controls'
import { RecipeResultsDrawer } from './recipe-results-drawer'
import { useCamera } from '@/hooks/use-camera'
import { useIngredientDetection } from '@/hooks/use-ingredient-detection'
import { findMatchingRecipes } from '@/lib/actions'
import type { Ingredient, RecipeMatch } from '@/lib/types'

interface FoodScannerProps {
  ingredients: Ingredient[]
}

export function FoodScanner({ ingredients }: FoodScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [recipes, setRecipes] = useState<RecipeMatch[]>([])
  const [isFindingRecipes, setIsFindingRecipes] = useState(false)

  const {
    videoRef,
    isActive,
    error: cameraError,
    startCamera,
    stopCamera
  } = useCamera()

  const {
    detectedIngredients,
    isLoading: isModelLoading,
    error: detectionError,
    clearDetections
  } = useIngredientDetection({
    ingredients,
    videoRef,
    isScanning
  })

  const handleStartCamera = useCallback(async () => {
    await startCamera()
  }, [startCamera])

  const handleStopCamera = useCallback(() => {
    setIsScanning(false)
    clearDetections()
    stopCamera()
  }, [stopCamera, clearDetections])

  const handleToggleScan = useCallback(() => {
    setIsScanning(prev => !prev)
  }, [])

  const handleFindRecipes = useCallback(async () => {
    if (detectedIngredients.length === 0) return
    
    setIsFindingRecipes(true)
    setIsScanning(false)
    
    try {
      const ingredientIds = detectedIngredients.map(d => d.ingredient.id)
      const matchedRecipes = await findMatchingRecipes(ingredientIds)
      setRecipes(matchedRecipes)
      setIsDrawerOpen(true)
    } catch (err) {
      console.error('Error finding recipes:', err)
    } finally {
      setIsFindingRecipes(false)
    }
  }, [detectedIngredients])

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false)
    setRecipes([])
    clearDetections()
  }, [clearDetections])

  const error = cameraError || detectionError

  return (
    <div className="relative w-full h-screen bg-background overflow-hidden">
      {/* Camera view */}
      <CameraView
        ref={videoRef}
        isScanning={isScanning}
        detectedIngredients={detectedIngredients}
      />

      {/* Scanner controls */}
      <ScannerControls
        isActive={isActive}
        isScanning={isScanning}
        isLoading={isModelLoading || isFindingRecipes}
        detectionCount={detectedIngredients.length}
        onStartCamera={handleStartCamera}
        onStopCamera={handleStopCamera}
        onToggleScan={handleToggleScan}
        onFindRecipes={handleFindRecipes}
      />

      {/* Error display */}
      {error && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-destructive/90 text-destructive-foreground px-6 py-4 rounded-xl text-center max-w-sm">
          {error}
        </div>
      )}

      {/* Recipe results drawer */}
      <RecipeResultsDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        recipes={recipes}
        detectedIngredients={detectedIngredients.map(d => d.ingredient)}
      />
    </div>
  )
}
