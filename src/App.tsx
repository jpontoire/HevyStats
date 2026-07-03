import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db/db'
import Header, { type NavTarget } from './components/Header'
import HomeView from './views/HomeView'
import DashboardView from './views/DashboardView'
import WorkoutDetailView from './views/WorkoutDetailView'
import ExercisesView from './views/ExercisesView'
import ExerciseDetailView from './views/ExerciseDetailView'
import CoachView from './views/CoachView'

type Route =
  | { name: 'import' }
  | { name: 'dashboard' }
  | { name: 'exercises' }
  | { name: 'exercise'; title: string }
  | { name: 'coach' }
  | { name: 'workout'; id: number; from?: Route }

const NAV_ROUTES: Record<NavTarget, Route> = {
  dashboard: { name: 'dashboard' },
  exercises: { name: 'exercises' },
  coach: { name: 'coach' },
  import: { name: 'import' },
}

function activeNavFor(route: Route): NavTarget {
  switch (route.name) {
    case 'import':
      return 'import'
    case 'coach':
      return 'coach'
    case 'exercises':
    case 'exercise':
      return 'exercises'
    case 'workout':
      return route.from ? activeNavFor(route.from) : 'dashboard'
    default:
      return 'dashboard'
  }
}

function App() {
  const [route, setRoute] = useState<Route | null>(null)
  const workoutCount = useLiveQuery(() => db.workouts.count())

  // Wait for the first count so we can land on the right view without a flash
  if (workoutCount === undefined) return null

  const active: Route =
    route ?? { name: workoutCount > 0 ? 'dashboard' : 'import' }

  return (
    <div className="min-h-screen">
      <Header
        active={activeNavFor(active)}
        onNavigate={(target) => setRoute(NAV_ROUTES[target])}
      />
      {active.name === 'import' && <HomeView />}
      {active.name === 'dashboard' && (
        <DashboardView
          onOpenWorkout={(id) => setRoute({ name: 'workout', id })}
          onGoToImport={() => setRoute({ name: 'import' })}
        />
      )}
      {active.name === 'coach' && <CoachView />}
      {active.name === 'exercises' && (
        <ExercisesView
          onOpenExercise={(title) => setRoute({ name: 'exercise', title })}
        />
      )}
      {active.name === 'exercise' && (
        <ExerciseDetailView
          title={active.title}
          onBack={() => setRoute({ name: 'exercises' })}
          onOpenWorkout={(id) =>
            setRoute({ name: 'workout', id, from: active })
          }
        />
      )}
      {active.name === 'workout' && (
        <WorkoutDetailView
          workoutId={active.id}
          onBack={() => setRoute(active.from ?? { name: 'dashboard' })}
        />
      )}
    </div>
  )
}

export default App
