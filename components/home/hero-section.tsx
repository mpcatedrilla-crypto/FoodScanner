'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Camera, Sparkles } from 'lucide-react'

export function HeroSection() {
  const [imageLoaded, setImageLoaded] = useState(false)

  return (
    <section className="relative min-h-[70vh] flex flex-col justify-end overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero-food.jpg"
          alt="Fresh Filipino ingredients"
          fill
          className={`object-cover transition-opacity duration-700 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          priority
          onLoad={() => setImageLoaded(true)}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 pb-8 pt-24">
        {/* Logo badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">AI-Powered</span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-3 text-balance">
          Scan ingredients,
          <br />
          <span className="text-primary">discover recipes</span>
        </h1>

        {/* Subheading */}
        <p className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-sm">
          Point your camera at ingredients and instantly find authentic Filipino recipes you can cook.
        </p>

        {/* CTA Button */}
        <Link
          href="/scan"
          className="inline-flex items-center justify-center gap-3 w-full py-4 px-6 rounded-2xl bg-primary text-primary-foreground font-semibold text-lg shadow-lg shadow-primary/25 active:scale-[0.98] transition-transform"
        >
          <Camera className="w-6 h-6" />
          Start Scanning
        </Link>
      </div>
    </section>
  )
}
