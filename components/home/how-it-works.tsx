import { Camera, Search, BookOpen } from 'lucide-react'

const steps = [
  {
    icon: Camera,
    title: 'Scan',
    description: 'Point your camera at ingredients in your kitchen',
  },
  {
    icon: Search,
    title: 'Match',
    description: 'AI detects items and finds compatible recipes',
  },
  {
    icon: BookOpen,
    title: 'Cook',
    description: 'Follow step-by-step instructions and enjoy',
  },
]

export function HowItWorks() {
  return (
    <section className="px-6 py-8 bg-card/50">
      <h2 className="text-xl font-bold text-foreground mb-6">How It Works</h2>

      <div className="flex flex-col gap-4">
        {steps.map((step, index) => (
          <div
            key={step.title}
            className="flex items-start gap-4"
          >
            {/* Step number with icon */}
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <step.icon className="w-6 h-6 text-primary" />
              </div>
              {index < steps.length - 1 && (
                <div className="absolute top-12 left-1/2 -translate-x-1/2 w-px h-4 bg-border" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pt-1">
              <h3 className="font-semibold text-foreground mb-1">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
