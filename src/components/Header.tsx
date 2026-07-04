export type NavTarget = 'dashboard' | 'exercises' | 'coach' | 'import'

interface HeaderProps {
  active: NavTarget
  onNavigate: (target: NavTarget) => void
}

const LINKS: { target: NavTarget; label: string }[] = [
  { target: 'dashboard', label: 'Dashboard' },
  { target: 'exercises', label: 'Exercises' },
  { target: 'coach', label: 'Coach' },
  { target: 'import', label: 'Import' },
]

function Header({ active, onNavigate }: HeaderProps) {
  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className="shrink-0 text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100"
        >
          HevyStats
        </button>
        <nav className="flex gap-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-1">
          {LINKS.map(({ target, label }) => (
            <button
              key={target}
              type="button"
              onClick={() => onNavigate(target)}
              className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors sm:px-3 ${
                active === target
                  ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}

export default Header
