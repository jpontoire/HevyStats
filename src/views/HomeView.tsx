function HomeView() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
        HevyStats
      </h1>
      <p className="max-w-xl text-neutral-600 dark:text-neutral-400">
        Drop your Hevy CSV export to unlock your full history and get
        advanced strength and volume statistics, computed and stored locally
        in your browser.
      </p>
    </main>
  )
}

export default HomeView
