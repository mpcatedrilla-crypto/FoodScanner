import { FoodScanner } from '@/components/scanner/food-scanner'
import { getIngredients } from '@/lib/actions'

export default async function ScanPage() {
  const ingredients = await getIngredients()

  return (
    <main className="min-h-screen">
      <FoodScanner ingredients={ingredients} />
    </main>
  )
}
