import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db/db'
import Header, { type NavTarget } from './components/Header'
import HomeView from './views/HomeView'
import DashboardView from './views/DashboardView'
import WorkoutDetailView from './views/WorkoutDetailView'

type Route =
  | { name: 'import' }
  | { name: 'dashboard' }
  | { name: 'workout'; id: number }

function App() {
  const [route, setRoute] = useState<Route | null>(null)
  const workoutCount = useLiveQuery(() => db.workouts.count())

  // Wait for the first count so we can land on the right view without a flash
  if (workoutCount === undefined) return null

  const active: Route =
    route ?? { name: workoutCount > 0 ? 'dashboard' : 'import' }
  const activeNav: NavTarget = active.name === 'import' ? 'import' : 'dashboard'

  return (
    <div className="min-h-screen">
      <Header
        active={activeNav}
        onNavigate={(name) =>
          setRoute(name === 'import' ? { name: 'import' } : { name: 'dashboard' })
        }
      />
      {active.name === 'import' && <HomeView />}
      {active.name === 'dashboard' && (
        <DashboardView
          onOpenWorkout={(id) => setRoute({ name: 'workout', id })}
          onGoToImport={() => setRoute({ name: 'import' })}
        />
      )}
      {active.name === 'workout' && (
        <WorkoutDetailView
          workoutId={active.id}
          onBack={() => setRoute({ name: 'dashboard' })}
        />
      )}
    </div>
  )
}

export default App
