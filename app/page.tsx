import { HeroSection } from '@/components/home/hero-section'
import { FeaturedRecipes } from '@/components/home/featured-recipes'
import { HowItWorks } from '@/components/home/how-it-works'
import { BottomNav } from '@/components/home/bottom-nav'
import { getRecipes } from '@/lib/actions'

export default async function HomePage() {
  const recipes = await getRecipes()

  return (
    <main className="min-h-screen pb-24">
      <HeroSection />
      <FeaturedRecipes recipes={recipes} />
      <HowItWorks />
      <BottomNav />
    </main>
  )
}
