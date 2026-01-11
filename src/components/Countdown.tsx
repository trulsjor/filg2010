import { useState, useEffect } from 'react'

interface CountdownProps {
  date: string // DD.MM.YYYY
  time: string // HH:MM
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

function parseMatchDate(date: string, time: string): Date {
  const [day, month, year] = date.split('.').map(Number)
  const [hours, minutes] = time.split(':').map(Number)
  return new Date(year, month - 1, day, hours, minutes)
}

function calculateTimeLeft(targetDate: Date): TimeLeft {
  const now = new Date()
  const diff = targetDate.getTime() - now.getTime()

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    total: diff,
  }
}

export function Countdown({ date, time }: CountdownProps) {
  const targetDate = parseMatchDate(date, time)
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(targetDate))

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate))
    }, 1000)

    return () => clearInterval(timer)
  }, [date, time])

  if (timeLeft.total <= 0) {
    return <div className="countdown countdown-live">Kampen pågår!</div>
  }

  return (
    <div className="countdown">
      <span className="countdown-prefix">Neste kamp om</span>
      {timeLeft.days > 0 && (
        <div className="countdown-unit">
          <span className="countdown-value">{timeLeft.days}</span>
          <span className="countdown-label">d</span>
        </div>
      )}
      <div className="countdown-unit">
        <span className="countdown-value">{timeLeft.hours.toString().padStart(2, '0')}</span>
        <span className="countdown-label">t</span>
      </div>
      <div className="countdown-unit">
        <span className="countdown-value">{timeLeft.minutes.toString().padStart(2, '0')}</span>
        <span className="countdown-label">m</span>
      </div>
      <div className="countdown-unit">
        <span className="countdown-value">{timeLeft.seconds.toString().padStart(2, '0')}</span>
        <span className="countdown-label">s</span>
      </div>
    </div>
  )
}
