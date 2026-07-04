import { useState, type ChangeEvent, type DragEvent } from 'react'

interface DropZoneProps {
  onFile: (file: File) => void
  disabled?: boolean
}

function isSupportedFile(file: File): boolean {
  const name = file.name.toLowerCase()
  return (
    name.endsWith('.csv') ||
    name.endsWith('.json') ||
    file.type === 'text/csv' ||
    file.type === 'application/json'
  )
}

function DropZone({ onFile, disabled = false }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [rejected, setRejected] = useState(false)

  const handleFile = (file: File | undefined) => {
    if (!file) return
    if (!isSupportedFile(file)) {
      setRejected(true)
      return
    }
    setRejected(false)
    onFile(file)
  }

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setIsDragOver(false)
    if (disabled) return
    handleFile(event.dataTransfer.files[0])
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.[0])
    event.target.value = ''
  }

  return (
    <div className="w-full">
      <label
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled) setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-12 transition-colors ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40'
            : 'border-neutral-300 hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-500'
        } ${disabled ? 'pointer-events-none opacity-50' : ''}`}
      >
        <span className="text-lg font-medium text-neutral-800 dark:text-neutral-200">
          Drop your <code className="font-mono">workout_data.csv</code> or a
          HevyStats backup here
        </span>
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          or click to browse — the file never leaves your browser
        </span>
        <input
          type="file"
          accept=".csv,.json,text/csv,application/json"
          className="hidden"
          disabled={disabled}
          onChange={handleChange}
        />
      </label>
      {rejected && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          Please choose a .csv file (Hevy export) or a .json HevyStats backup.
        </p>
      )}
    </div>
  )
}

export default DropZone
