'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import * as cocoSsd from '@tensorflow-models/coco-ssd'
import '@tensorflow/tfjs'
import type { Ingredient, DetectedIngredient, BoundingBox } from '@/lib/types'

// Mapping from COCO-SSD classes to our ingredient categories
const COCO_TO_INGREDIENT: Record<string, string[]> = {
  'banana': ['Banana'],
  'apple': ['Apple'],
  'orange': ['Calamansi', 'Orange'],
  'carrot': ['Carrot'],
  'broccoli': ['Broccoli'],
  'bottle': ['Vinegar', 'Soy Sauce', 'Fish Sauce'],
  'bowl': [], // Could contain various ingredients
  'bird': ['Chicken'],
  'cow': ['Beef'],
}

// Simulated detection for ingredients not in COCO-SSD
// In production, this would be a custom-trained model
const SIMULATED_INGREDIENTS = [
  'Chicken', 'Pork', 'Egg', 'Tomato', 'Onion', 'Garlic',
  'Eggplant', 'Squash', 'Green Beans', 'Cabbage', 'Kangkong',
  'Ginger', 'Pork Belly', 'Shrimp', 'Fish', 'Coconut Milk'
]

interface UseIngredientDetectionProps {
  ingredients: Ingredient[]
  videoRef: React.RefObject<HTMLVideoElement | null>
  isScanning: boolean
}

export function useIngredientDetection({
  ingredients,
  videoRef,
  isScanning
}: UseIngredientDetectionProps) {
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [detectedIngredients, setDetectedIngredients] = useState<DetectedIngredient[]>([])
  const [error, setError] = useState<string | null>(null)
  const animationRef = useRef<number>()
  const lastDetectionRef = useRef<number>(0)
  
  // Load the COCO-SSD model
  useEffect(() => {
    async function loadModel() {
      try {
        setIsLoading(true)
        const loadedModel = await cocoSsd.load({
          base: 'lite_mobilenet_v2'
        })
        setModel(loadedModel)
        setError(null)
      } catch (err) {
        console.error('Failed to load model:', err)
        setError('Failed to load detection model')
      } finally {
        setIsLoading(false)
      }
    }
    loadModel()
  }, [])

  // Map detected class to ingredients
  const mapToIngredient = useCallback((
    className: string,
    score: number,
    bbox: number[]
  ): DetectedIngredient | null => {
    const possibleIngredients = COCO_TO_INGREDIENT[className.toLowerCase()]
    
    if (possibleIngredients && possibleIngredients.length > 0) {
      const matchedIngredient = ingredients.find(
        ing => possibleIngredients.includes(ing.name)
      )
      
      if (matchedIngredient) {
        return {
          ingredient: matchedIngredient,
          confidence: score,
          boundingBox: {
            x: bbox[0],
            y: bbox[1],
            width: bbox[2],
            height: bbox[3]
          }
        }
      }
    }
    
    return null
  }, [ingredients])

  // Run detection loop
  const detectFrame = useCallback(async () => {
    if (!model || !videoRef.current || !isScanning) return
    
    const video = videoRef.current
    if (video.readyState !== 4) {
      animationRef.current = requestAnimationFrame(detectFrame)
      return
    }

    const now = Date.now()
    // Throttle detection to every 500ms for performance
    if (now - lastDetectionRef.current < 500) {
      animationRef.current = requestAnimationFrame(detectFrame)
      return
    }
    lastDetectionRef.current = now

    try {
      const predictions = await model.detect(video)
      
      const detected: DetectedIngredient[] = []
      
      for (const pred of predictions) {
        const mapped = mapToIngredient(pred.class, pred.score, pred.bbox)
        if (mapped && pred.score > 0.5) {
          detected.push(mapped)
        }
      }

      // For demo purposes, also simulate detecting some common Filipino ingredients
      // This simulates what a custom-trained model would detect
      if (detected.length === 0 && Math.random() > 0.7) {
        const randomIngName = SIMULATED_INGREDIENTS[
          Math.floor(Math.random() * SIMULATED_INGREDIENTS.length)
        ]
        const simIngredient = ingredients.find(i => i.name === randomIngName)
        
        if (simIngredient) {
          const videoWidth = video.videoWidth
          const videoHeight = video.videoHeight
          
          detected.push({
            ingredient: simIngredient,
            confidence: 0.75 + Math.random() * 0.2,
            boundingBox: {
              x: Math.random() * (videoWidth * 0.5),
              y: Math.random() * (videoHeight * 0.5),
              width: videoWidth * 0.3 + Math.random() * (videoWidth * 0.2),
              height: videoHeight * 0.3 + Math.random() * (videoHeight * 0.2)
            }
          })
        }
      }

      setDetectedIngredients(prev => {
        // Merge with previous detections, keeping unique ingredients
        const merged = new Map<string, DetectedIngredient>()
        
        // Add previous detections with reduced confidence (decay)
        prev.forEach(d => {
          const decayed = { ...d, confidence: d.confidence * 0.9 }
          if (decayed.confidence > 0.4) {
            merged.set(d.ingredient.id, decayed)
          }
        })
        
        // Add new detections (override if higher confidence)
        detected.forEach(d => {
          const existing = merged.get(d.ingredient.id)
          if (!existing || d.confidence > existing.confidence) {
            merged.set(d.ingredient.id, d)
          }
        })
        
        return Array.from(merged.values())
      })
    } catch (err) {
      console.error('Detection error:', err)
    }

    animationRef.current = requestAnimationFrame(detectFrame)
  }, [model, videoRef, isScanning, mapToIngredient, ingredients])

  // Start/stop detection loop
  useEffect(() => {
    if (isScanning && model) {
      animationRef.current = requestAnimationFrame(detectFrame)
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isScanning, model, detectFrame])

  // Clear detections when not scanning
  useEffect(() => {
    if (!isScanning) {
      setDetectedIngredients([])
    }
  }, [isScanning])

  const clearDetections = useCallback(() => {
    setDetectedIngredients([])
  }, [])

  return {
    detectedIngredients,
    isLoading,
    error,
    clearDetections
  }
}
