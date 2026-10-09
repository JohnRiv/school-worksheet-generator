import { BookOpenCheck, Cpu, AlertTriangle, Download } from 'lucide-react'
import { useAppContext } from '@/context/AppContext'
import { Badge } from '@/components/ui/badge'

export function Header() {
  const { setCurrentView, aiAvailability } = useAppContext()

  const renderAvailabilityBadge = () => {
    if (aiAvailability === 'readily') {
      return (
        <Badge
          id="ai-status-badge"
          variant="secondary"
          className="bg-emerald-500/20 text-emerald-100 border border-emerald-400/40 flex items-center gap-1.5 px-3 py-1"
        >
          <Cpu className="h-3.5 w-3.5 text-emerald-300" />
          <span>Chrome Prompt API Ready</span>
        </Badge>
      )
    }

    if (aiAvailability === 'after-download') {
      return (
        <Badge
          id="ai-status-badge"
          variant="secondary"
          className="bg-amber-500/20 text-amber-100 border border-amber-400/40 flex items-center gap-1.5 px-3 py-1"
        >
          <Download className="h-3.5 w-3.5 text-amber-300" />
          <span>Model Download Needed</span>
        </Badge>
      )
    }

    if (aiAvailability === 'unavailable') {
      return (
        <Badge
          id="ai-status-badge"
          variant="destructive"
          className="flex items-center gap-1.5 px-3 py-1"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>Prompt API Unavailable</span>
        </Badge>
      )
    }

    return (
      <Badge
        id="ai-status-badge"
        variant="secondary"
        className="bg-primary-foreground/10 text-primary-foreground/80 px-3 py-1"
      >
        Checking AI...
      </Badge>
    )
  }

  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4 py-4 max-w-5xl flex justify-between items-center gap-4">
        <button
          type="button"
          onClick={() => setCurrentView('upload')}
          className="flex items-center gap-2 text-left hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
        >
          <BookOpenCheck className="h-8 w-8 shrink-0" />
          <h1 className="text-xl sm:text-2xl font-bold font-headline">
            School Worksheet Generator
          </h1>
        </button>
        <div className="flex items-center justify-end shrink-0">
          {renderAvailabilityBadge()}
        </div>
      </div>
    </header>
  )
}
