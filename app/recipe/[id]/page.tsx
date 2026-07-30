import { notFound } from 'next/navigation'
import { getRecipeById } from '@/lib/actions'
import { RecipeDetail } from '@/components/recipe/recipe-detail'

interface RecipePageProps {
  params: Promise<{ id: string }>
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { id } = await params
  const recipe = await getRecipeById(id)

  if (!recipe) {
    notFound()
  }

  return <RecipeDetail recipe={recipe} />
}
