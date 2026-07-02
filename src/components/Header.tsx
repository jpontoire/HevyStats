export type NavTarget = 'dashboard' | 'import'

interface HeaderProps {
  active: NavTarget
  onNavigate: (target: NavTarget) => void
}

const LINKS: { target: NavTarget; label: string }[] = [
  { target: 'dashboard', label: 'Dashboard' },
  { target: 'import', label: 'Import' },
]

function Header({ active, onNavigate }: HeaderProps) {
  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100"
        >
          HevyStats
        </button>
        <nav className="flex gap-1">
          {LINKS.map(({ target, label }) => (
            <button
              key={target}
              type="button"
              onClick={() => onNavigate(target)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
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
