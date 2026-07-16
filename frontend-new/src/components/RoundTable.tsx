import { useRef, useEffect, useCallback } from 'react'
import type { Expert, TranscriptEntry } from '../types'

interface Props {
  experts: Expert[]
  transcript: TranscriptEntry[]
  speakingId: string | null
  topic: string
}

export function RoundTable({ experts, transcript, speakingId, topic }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const glowPhaseRef = useRef(0)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    glowPhaseRef.current += 0.02

    // Clear
    ctx.clearRect(0, 0, W, H)

    const cx = W / 2
    const cy = H / 2 + 10
    const rx = Math.min(W * 0.42, 320)
    const ry = Math.min(H * 0.38, 240)

    // === Draw table surface (ellipse with gradient) ===
    // Shadow/glow
    ctx.save()
    ctx.shadowColor = 'rgba(129, 140, 248, 0.08)'
    ctx.shadowBlur = 60
    ctx.beginPath()
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(30, 24, 56, 0.4)'
    ctx.fill()
    ctx.restore()

    // Table rim
    ctx.save()
    ctx.beginPath()
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(160, 140, 250, 0.5)'
    ctx.lineWidth = 2.5
    ctx.stroke()
    ctx.restore()

    // Inner table gradient
    const grad = ctx.createRadialGradient(cx, cy - ry * 0.2, 0, cx, cy, ry)
    grad.addColorStop(0, 'rgba(45, 36, 80, 0.25)')
    grad.addColorStop(0.6, 'rgba(30, 24, 55, 0.2)')
    grad.addColorStop(1, 'rgba(15, 12, 30, 0.15)')
    ctx.save()
    ctx.beginPath()
    ctx.ellipse(cx, cy, rx * 0.9, ry * 0.85, 0, 0, Math.PI * 2)
    ctx.fillStyle = grad
    ctx.fill()
    ctx.restore()

    // === Draw expert seats along the top arc ===
    const n = experts.length
    const hostIdx = experts.findIndex((e) => e.role === 'host')
    const sorted = [...experts].sort((a, b) => {
      if (a.role === 'host') return -1
      if (b.role === 'host') return 1
      return 0
    })

    sorted.forEach((expert, i) => {
      // Position along the top half of the ellipse
      const t = n > 1 ? i / (n - 1) : 0.5 // 0..1
      const angle = -Math.PI * 0.85 + Math.PI * 0.85 * t // from -153° to 153°
      const seatX = cx + rx * 1.25 * Math.cos(angle)
      const seatY = cy + ry * 0.9 * Math.sin(angle)

      // Check if speaking
      const isSpeaking = expert.id === speakingId
      const glow = isSpeaking ? 0.5 + 0.3 * Math.sin(glowPhaseRef.current) : 0

      // Seat circle
      const radius = expert.role === 'host' ? 24 : 20
      const color = expert.color_identity || '#818cf8'

      // Glow when speaking
      if (isSpeaking) {
        ctx.save()
        ctx.shadowColor = color
        ctx.shadowBlur = 30 * glow
        ctx.beginPath()
        ctx.arc(seatX, seatY, radius + 4, 0, Math.PI * 2)
        ctx.fillStyle = `${color}${Math.floor(glow * 80).toString(16).padStart(2, '0')}`
        ctx.fill()
        ctx.restore()
      }

      // Avatar circle
      ctx.save()
      ctx.beginPath()
      ctx.arc(seatX, seatY, radius, 0, Math.PI * 2)
      ctx.fillStyle = `${color}${isSpeaking ? '66' : '33'}`
      ctx.fill()
      ctx.strokeStyle = isSpeaking ? color : `${color}66`
      ctx.lineWidth = isSpeaking ? 2.5 : 1.5
      ctx.stroke()
      ctx.restore()

      // Emoji
      ctx.save()
      ctx.font = `${radius}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(expert.avatar_emoji || '🧑', seatX, seatY + 1)
      ctx.restore()

      // Name below seat
      ctx.save()
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillStyle = isSpeaking ? color : '#a0a0b8'
      ctx.fillText(expert.name, seatX, seatY + radius + 14)
      ctx.restore()

      // Role badge
      if (expert.role === 'host') {
        ctx.save()
        ctx.font = '9px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillStyle = '#818cf8'
        ctx.fillText('🎙 主持人', seatX, seatY + radius + 26)
        ctx.restore()
      }

      // Connecting line from seat to table edge
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(seatX, seatY + radius + 4)
      const edgeX = cx + rx * 0.95 * Math.cos(angle)
      const edgeY = cy + ry * 0.85 * Math.sin(angle)
      ctx.lineTo(edgeX, edgeY)
      ctx.strokeStyle = `${color}22`
      ctx.lineWidth = 1
      ctx.setLineDash([2, 3])
      ctx.stroke()
      ctx.restore()
    })

    // === Draw transcript entries on the table ===
    const visible = transcript.slice(-4) // show last 4
    const startY = cy - ry * 0.4

    visible.forEach((entry, i) => {
      const entryY = startY + i * 32
      if (entryY > cy + ry * 0.3) return

      const color = '#818cf8'

      // Background bubble
      ctx.save()
      const bubbleW = Math.min(W * 0.5, 300)
      const bubbleX = cx - bubbleW / 2
      ctx.fillStyle = 'rgba(12, 10, 24, 0.5)'
      ctx.beginPath()
      ctx.roundRect(bubbleX, entryY, bubbleW, 28, 6)
      ctx.fill()
      ctx.restore()

      // Left accent bar
      ctx.save()
      ctx.fillStyle = color
      ctx.fillRect(bubbleX, entryY + 2, 3, 24)
      ctx.restore()

      // Speaker name
      ctx.save()
      ctx.font = 'bold 11px sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = color
      ctx.fillText(entry.speaker_name, bubbleX + 10, entryY + 14)
      ctx.restore()

      // Content (truncated)
      ctx.save()
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#c8c8d8'
      const text = entry.content.length > 25 ? entry.content.slice(0, 24) + '…' : entry.content
      ctx.fillText(text, bubbleX + 10 + ctx.measureText(entry.speaker_name).width + 12, entryY + 14)
      ctx.restore()
    })

    animRef.current = requestAnimationFrame(draw)
  }, [experts, transcript, speakingId, topic])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      canvas.width = parent.clientWidth
      canvas.height = parent.clientHeight
    }
    resize()
    window.addEventListener('resize', resize)
    animRef.current = requestAnimationFrame(draw)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animRef.current)
    }
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
    />
  )
}
