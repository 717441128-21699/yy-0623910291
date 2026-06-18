import { useState, useRef, useEffect } from 'react'
import { Play, Pause } from 'lucide-react'

interface Props {
  blob: Blob | null
  duration: number
  size?: 'sm' | 'md'
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function VoicePlayer({ blob, duration, size = 'md' }: Props) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  useEffect(() => {
    if (blob) {
      objectUrlRef.current = URL.createObjectURL(blob)
    }
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
    }
  }, [blob])

  const togglePlay = () => {
    if (!audioRef.current || !objectUrlRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.src = objectUrlRef.current
      audioRef.current.play()
    }
  }

  const iconSize = size === 'sm' ? 14 : 18
  const containerSize = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={togglePlay}
        disabled={!blob}
        className={`${containerSize} rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center flex-shrink-0 transition-colors active:bg-teal-100`}
      >
        {isPlaying ? <Pause size={iconSize} className="text-teal-700" /> : <Play size={iconSize} className="text-teal-700 ml-0.5" />}
      </button>
      <div className="flex-1">
        <div className="h-1 bg-teal-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 rounded-full transition-all"
            style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-slate-400">{formatTime(currentTime)}</span>
          <span className="text-[10px] text-slate-400">{formatTime(duration || 0)}</span>
        </div>
      </div>
      <audio
        ref={audioRef}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false)
          setCurrentTime(0)
        }}
        onTimeUpdate={(e) => setCurrentTime((e.target as HTMLAudioElement).currentTime)}
      />
    </div>
  )
}
