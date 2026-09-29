'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const germanNumbers = ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf']
const minuteWords: Record<number, string> = { 5: 'fünf', 10: 'zehn', 15: 'Viertel', 20: 'zwanzig', 25: 'fünf', 30: 'halb' }

function germanHour(hour: number) {
  return germanNumbers[hour % 12 || 12]
}

function twentyFourHour(hour: number) {
  return (hour % 12) + 12
}

function germanTime(hour: number, minute: number) {
  const next = (hour + 1) % 12 || 12
  if (minute === 0) return `${germanHour(hour)} Uhr`
  if (minute === 30) return `halb ${germanHour(next)}`
  if (minute === 15) return `Viertel nach ${germanHour(hour)}`
  if (minute === 45) return `Viertel vor ${germanHour(next)}`
  if (minute === 25) return `fünf vor halb ${germanHour(next)}`
  if (minute === 35) return `fünf nach halb ${germanHour(next)}`
  if (minute < 30 && minute % 5 === 0) return `${minuteWords[minute]} nach ${germanHour(hour)}`
  if (minute > 30 && minute % 5 === 0) return `${minuteWords[60 - minute]} vor ${germanHour(next)}`
  if (minute < 30) return `${germanHour(hour)} Uhr ${germanNumbers[minute] || minute}`
  return `${germanHour(next)} Uhr ${germanNumbers[60 - minute] || 60 - minute}`
}

function Clock({ hour, minute, onChange }: { hour: number; minute: number; onChange: (h: number, m: number) => void }) {
  const clockRef = useRef<SVGSVGElement>(null)
  const dragging = useRef<'hour' | 'minute' | null>(null)
  const displayHour = hour % 12

  const updateFromPoint = useCallback((event: PointerEvent | React.PointerEvent, hand: 'hour' | 'minute') => {
    const svg = clockRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const x = event.clientX - rect.left - rect.width / 2
    const y = event.clientY - rect.top - rect.height / 2
    let angle = (Math.atan2(y, x) * 180) / Math.PI + 90
    if (angle < 0) angle += 360
    if (hand === 'minute') {
      // The exercise uses five-minute intervals, so the hour hand advances cleanly with the minute hand.
      const minuteStep = Math.round(angle / 30) * 5
      const newMinute = minuteStep % 60
      const hourOffset = minuteStep === 60 ? 1 : 0
      onChange(((hour - 1 + hourOffset) % 12) + 1, newMinute)
    } else {
      const newHour = Math.round(angle / 30) % 12 || 12
      onChange(newHour, minute)
    }
  }, [hour, minute, onChange])

  useEffect(() => {
    const move = (event: PointerEvent) => { if (dragging.current) updateFromPoint(event, dragging.current) }
    const up = () => { dragging.current = null }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
  }, [updateFromPoint])

  const handStart = (hand: 'hour' | 'minute') => (event: React.PointerEvent) => {
    event.preventDefault()
    dragging.current = hand
    event.currentTarget.setPointerCapture?.(event.pointerId)
    updateFromPoint(event, hand)
  }

  const hourAngle = (displayHour + minute / 60) * 30
  const minuteAngle = minute * 6
  const numbers = Array.from({ length: 12 }, (_, index) => {
    const value = index + 1
    const angle = ((value * 30 - 90) * Math.PI) / 180
    return { value, x: 50 + Math.cos(angle) * 38, y: 50 + Math.sin(angle) * 38 }
  })

  return (
    <svg ref={clockRef} viewBox="0 0 100 100" className="clock-face" aria-label={`Uhr ${hour}:${String(minute).padStart(2, '0')}`}>
      <circle cx="50" cy="50" r="47" className="clock-shadow" />
      <circle cx="50" cy="50" r="45" className="clock-disc" />
      {Array.from({ length: 60 }, (_, index) => {
        const angle = (index * 6 * Math.PI) / 180
        const outer = index % 5 === 0 ? 43 : 44
        const inner = index % 5 === 0 ? 39.5 : 42.5
        return <line key={index} x1={50 + Math.sin(angle) * inner} y1={50 - Math.cos(angle) * inner} x2={50 + Math.sin(angle) * outer} y2={50 - Math.cos(angle) * outer} className={index % 5 === 0 ? 'clock-tick major' : 'clock-tick'} />
      })}
      {numbers.map(({ value, x, y }) => <text key={value} x={x} y={y} className="clock-number">{value}</text>)}
      <line x1="50" y1="54" x2="50" y2="19" className="hand-hit-area" transform={`rotate(${minuteAngle} 50 50)`} onPointerDown={handStart('minute')} />
      <line x1="50" y1="53" x2="50" y2="29" className="hand-hit-area" transform={`rotate(${hourAngle} 50 50)`} onPointerDown={handStart('hour')} />
      <line x1="50" y1="50" x2="50" y2="21" className="minute-hand" transform={`rotate(${minuteAngle} 50 50)`} pointerEvents="none" />
      <line x1="50" y1="50" x2="50" y2="30" className="hour-hand" transform={`rotate(${hourAngle} 50 50)`} pointerEvents="none" />
      <circle cx="50" cy="50" r="3.7" className="center-dot" />
    </svg>
  )
}

export default function Home() {
  const [hour, setHour] = useState(6)
  const [minute, setMinute] = useState(45)
  const [solved, setSolved] = useState(false)
  const [correct, setCorrect] = useState(4)
  const [target, setTarget] = useState({ hour: 6, minute: 45 })

  const changeTime = (newHour: number, newMinute: number) => {
    setHour(newHour)
    setMinute(newMinute)
    setSolved(false)
  }

  const newTime = () => {
    const nextHour = Math.floor(Math.random() * 12) + 1
    const nextMinute = Math.floor(Math.random() * 12) * 5
    setTarget({ hour: nextHour, minute: nextMinute })
    setHour(12)
    setMinute(0)
    setSolved(false)
  }

  const solve = () => {
    setSolved(true)
    if (hour === target.hour && minute === target.minute) setCorrect((value) => value + 1)
  }

  const speak = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(germanTime(hour, minute))
      utterance.lang = 'de-DE'
      utterance.rate = 0.86
      window.speechSynthesis.speak(utterance)
    }
  }

  const digital = `${String(twentyFourHour(hour)).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  const targetDigital = `${String(twentyFourHour(target.hour)).padStart(2, '0')}:${String(target.minute).padStart(2, '0')}`
  const analog = `${String(hour % 12 || 12).padStart(2, '0')}:${String(minute).padStart(2, '0')}`

  return (
    <main className="app-shell">
      <div className="decor decor-one" /><div className="decor decor-two" /><div className="sparkle sparkle-one">✦</div><div className="sparkle sparkle-two">✧</div>
      <header className="topbar"><div className="brand-mark">T</div><div><p className="eyebrow">Uhren-Abenteuer</p><h1>Timer-Check</h1></div><div className="score">Richtig: <strong>{correct}</strong> <span aria-hidden="true">★</span></div></header>
      <section className="practice-card">
        <div className="intro"><div className="intro-copy"><p className="kicker">Lerne die Uhr auf Deutsch</p><h2>Welche Uhrzeit ist es?</h2><p className="hint">Ziehe die Zeiger und finde es heraus.</p></div><div className="mascot" aria-hidden="true"><div className="mascot-face">◡</div><div className="mascot-clock">12</div></div></div>
        <div className="practice-layout">
          <div className="clock-column"><Clock hour={hour} minute={minute} onChange={changeTime} /><div className="legend"><span><i className="legend-hour" />Stundenzeiger</span><span><i className="legend-minute" />Minutenzeiger</span></div></div>
          <div className="answer-column">
            <button className="primary-button" onClick={solve}>Lösen</button>
            <button className="secondary-button" onClick={newTime}>Neue Uhrzeit <span aria-hidden="true">↗</span></button>
            <div className="target-note">Stelle die Uhr auf<br /><strong>{targetDigital}</strong></div>
          </div>
        </div>
        {solved && <section className="results" aria-live="polite"><p className="results-title">Deine Antwort</p><div className="result-grid"><div><span>Digital (24 Stunden)</span><strong>{digital}</strong></div><div><span>Analog / 12 Stunden</span><strong>{analog}</strong></div><div className="german-result"><span>Auf Deutsch</span><strong>{germanTime(hour, minute)}</strong><button className="audio-button" onClick={speak} aria-label="Uhrzeit anhören">◖))</button></div></div></section>}
      </section>
      <p className="footer-note">Creado por Emma Molina Sanchez (8 años) y Papá</p>
    </main>
  )
}
