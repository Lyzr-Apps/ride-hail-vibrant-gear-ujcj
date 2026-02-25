'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { callAIAgent, type AIAgentResponse } from '@/lib/aiAgent'
import parseLLMJson from '@/lib/jsonParser'
import { useCopyToClipboard } from '@/lib/clipboard'
import {
  listSchedules,
  pauseSchedule,
  resumeSchedule,
  cronToHuman,
  getScheduleLogs,
  updateScheduleMessage,
  type Schedule,
  type ExecutionLog,
} from '@/lib/scheduler'
import {
  HiOutlineChartBar,
  HiOutlineChatBubbleLeftRight,
  HiOutlineDocumentText,
  HiOutlineShieldCheck,
  HiOutlineCurrencyDollar,
  HiOutlineClock,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineArrowPath,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineExclamationTriangle,
  HiOutlineInformationCircle,
  HiOutlineClipboard,
  HiOutlineEnvelope,
  HiOutlinePlay,
  HiOutlinePause,
  HiOutlineBolt,
  HiOutlineUserGroup,
  HiOutlineMapPin,
  HiOutlineArrowTrendingUp,
  HiOutlineArrowTrendingDown,
  HiOutlineMinus,
  HiOutlineBars3,
  HiOutlineXCircle,
  HiOutlineCalendarDays,
  HiOutlineGlobeAlt,
  HiOutlineFlag,
  HiOutlineDocumentChartBar,
} from 'react-icons/hi2'
import {
  FiSearch,
  FiSend,
  FiLoader,
  FiCalendar,
  FiUser,
  FiFileText,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiCopy,
  FiRefreshCw,
  FiChevronRight,
  FiDownload,
} from 'react-icons/fi'

// ============================================================================
// Constants
// ============================================================================

const OPS_AGENT_ID = '699f7e80a0a8b404fa793c93'
const SUPPORT_AGENT_ID = '699f7e81a0a8b404fa793c95'
const PRICING_AGENT_ID = '699f7e8156858cf10118e1fe'
const COMPLIANCE_AGENT_ID = '699f7e81a0a8b404fa793c97'
const REPORT_AGENT_ID = '699f7e9686b6bb63c4e0ad6d'
const INITIAL_SCHEDULE_ID = '699f7e9b399dfadeac39a998'

type TabKey = 'dashboard' | 'support' | 'pricing' | 'compliance' | 'reports'

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <HiOutlineChartBar className="w-5 h-5" /> },
  { key: 'support', label: 'Support', icon: <HiOutlineChatBubbleLeftRight className="w-5 h-5" /> },
  { key: 'pricing', label: 'Pricing', icon: <HiOutlineCurrencyDollar className="w-5 h-5" /> },
  { key: 'compliance', label: 'Compliance', icon: <HiOutlineShieldCheck className="w-5 h-5" /> },
  { key: 'reports', label: 'Reports', icon: <HiOutlineDocumentText className="w-5 h-5" /> },
]

// ============================================================================
// HiyatCab Logo SVG
// ============================================================================

function HiyatCabLogo({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="HiyatCab logo"
    >
      <rect width="48" height="48" rx="12" fill="hsl(36, 60%, 31%)" />
      <rect x="2" y="2" width="44" height="44" rx="10" fill="hsl(20, 30%, 8%)" />
      {/* Car body */}
      <path
        d="M10 30 L14 22 L20 18 L34 18 L38 24 L40 28 L40 32 L8 32 L8 28 Z"
        fill="hsl(36, 60%, 31%)"
        stroke="hsl(36, 60%, 38%)"
        strokeWidth="0.5"
      />
      {/* Windshield */}
      <path
        d="M15 22 L20 18.5 L28 18.5 L28 22 Z"
        fill="hsl(20, 25%, 12%)"
        stroke="hsl(36, 60%, 38%)"
        strokeWidth="0.3"
      />
      {/* Rear window */}
      <path
        d="M29.5 18.5 L33.5 18.5 L36.5 22 L29.5 22 Z"
        fill="hsl(20, 25%, 12%)"
        stroke="hsl(36, 60%, 38%)"
        strokeWidth="0.3"
      />
      {/* Roof light */}
      <rect x="22" y="14" width="10" height="4" rx="2" fill="hsl(36, 60%, 45%)" />
      <rect x="24" y="15" width="6" height="2" rx="1" fill="hsl(45, 80%, 65%)" />
      {/* Front wheel */}
      <circle cx="16" cy="32" r="4" fill="hsl(20, 18%, 15%)" stroke="hsl(36, 60%, 31%)" strokeWidth="1.5" />
      <circle cx="16" cy="32" r="1.5" fill="hsl(36, 60%, 38%)" />
      {/* Rear wheel */}
      <circle cx="36" cy="32" r="4" fill="hsl(20, 18%, 15%)" stroke="hsl(36, 60%, 31%)" strokeWidth="1.5" />
      <circle cx="36" cy="32" r="1.5" fill="hsl(36, 60%, 38%)" />
      {/* Headlight */}
      <rect x="6" y="27" width="3" height="3" rx="1" fill="hsl(45, 80%, 65%)" />
      {/* Taillight */}
      <rect x="40" y="27" width="2" height="3" rx="0.5" fill="hsl(0, 63%, 45%)" />
    </svg>
  )
}

function HiyatCabLogoSmall() {
  return (
    <svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="12" fill="hsl(36, 60%, 31%)" />
      <rect x="2" y="2" width="44" height="44" rx="10" fill="hsl(20, 30%, 8%)" />
      <path d="M10 30 L14 22 L20 18 L34 18 L38 24 L40 28 L40 32 L8 32 L8 28 Z" fill="hsl(36, 60%, 31%)" />
      <rect x="22" y="14" width="10" height="4" rx="2" fill="hsl(36, 60%, 45%)" />
      <rect x="24" y="15" width="6" height="2" rx="1" fill="hsl(45, 80%, 65%)" />
      <circle cx="16" cy="32" r="4" fill="hsl(20, 18%, 15%)" stroke="hsl(36, 60%, 31%)" strokeWidth="1.5" />
      <circle cx="36" cy="32" r="4" fill="hsl(20, 18%, 15%)" stroke="hsl(36, 60%, 31%)" strokeWidth="1.5" />
    </svg>
  )
}

// ============================================================================
// Agent Call Helper
// ============================================================================

async function callAndParse(message: string, agentId: string) {
  const result: AIAgentResponse = await callAIAgent(message, agentId)
  if (!result.success) {
    return { success: false as const, data: null, error: result.error || 'Agent call failed' }
  }
  const rawResult = result.response?.result
  let parsed = rawResult
  if (typeof rawResult === 'string') {
    parsed = parseLLMJson(rawResult)
  } else if (rawResult && typeof rawResult === 'object') {
    if (rawResult.result && typeof rawResult.result === 'object') {
      parsed = rawResult.result
    } else {
      parsed = rawResult
    }
  }
  if (parsed && parsed.success === false && parsed.error) {
    const msg = result.response?.message
    if (msg) {
      const msgParsed = parseLLMJson(msg)
      if (msgParsed && !msgParsed.error) {
        parsed = msgParsed
      }
    }
  }
  return { success: true as const, data: parsed, error: null }
}

// ============================================================================
// ErrorBoundary
// ============================================================================

class PageErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <HiyatCabLogo size={48} />
            <h2 className="text-xl font-semibold mt-4 mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-accent text-accent-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ============================================================================
// Skeleton Loader
// ============================================================================

function SkeletonBlock({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-5 bg-muted rounded w-3/4" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-4 bg-muted rounded" style={{ width: `${85 - i * 8}%` }} />
      ))}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="h-20 bg-muted rounded-lg" />
        <div className="h-20 bg-muted rounded-lg" />
      </div>
    </div>
  )
}

// ============================================================================
// StatusMessage
// ============================================================================

function StatusMessage({
  type,
  message,
  onDismiss,
}: {
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  onDismiss?: () => void
}) {
  const styles = {
    success: 'bg-green-900/30 border-green-700/50 text-green-300',
    error: 'bg-red-900/30 border-red-700/50 text-red-300',
    warning: 'bg-yellow-900/30 border-yellow-700/50 text-yellow-300',
    info: 'bg-blue-900/30 border-blue-700/50 text-blue-300',
  }
  const icons = {
    success: <FiCheckCircle className="w-4 h-4 flex-shrink-0" />,
    error: <FiAlertCircle className="w-4 h-4 flex-shrink-0" />,
    warning: <HiOutlineExclamationTriangle className="w-4 h-4 flex-shrink-0" />,
    info: <HiOutlineInformationCircle className="w-4 h-4 flex-shrink-0" />,
  }
  return (
    <div className={`flex items-start gap-2.5 p-3 rounded-lg border text-sm ${styles[type]}`}>
      {icons[type]}
      <span className="flex-1 leading-relaxed">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="opacity-60 hover:opacity-100 transition-opacity">
          <HiOutlineXMark className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

// ============================================================================
// Badge Components
// ============================================================================

function SeverityBadge({ severity }: { severity: string }) {
  const s = (severity || '').toLowerCase()
  let cls = 'bg-muted text-muted-foreground'
  if (s === 'critical' || s === 'very high')
    cls = 'bg-red-900/40 text-red-300 border border-red-700/40'
  else if (s === 'high' || s === 'urgent')
    cls = 'bg-orange-900/40 text-orange-300 border border-orange-700/40'
  else if (s === 'medium' || s === 'moderate')
    cls = 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/40'
  else if (s === 'low') cls = 'bg-green-900/40 text-green-300 border border-green-700/40'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {severity}
    </span>
  )
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const v = (verdict || '').toLowerCase()
  let cls = 'bg-muted text-muted-foreground'
  if (v.includes('approved') || v.includes('pass'))
    cls = 'bg-green-900/40 text-green-300 border border-green-700/40'
  else if (v.includes('rejected') || v.includes('fail'))
    cls = 'bg-red-900/40 text-red-300 border border-red-700/40'
  else if (v.includes('review') || v.includes('warning') || v.includes('needs'))
    cls = 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/40'
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${cls}`}>
      {verdict}
    </span>
  )
}

function CheckStatusIcon({ status }: { status: string }) {
  const s = (status || '').toLowerCase()
  if (s === 'pass' || s === 'passed' || s === 'valid')
    return <HiOutlineCheck className="w-5 h-5 text-green-400" />
  if (s === 'fail' || s === 'failed' || s === 'invalid')
    return <HiOutlineXMark className="w-5 h-5 text-red-400" />
  return <HiOutlineExclamationTriangle className="w-5 h-5 text-yellow-400" />
}

function ImpactBadge({ impact }: { impact: string }) {
  const i = (impact || '').toLowerCase()
  let cls = 'bg-muted text-muted-foreground'
  if (i === 'high') cls = 'bg-red-900/40 text-red-300'
  else if (i === 'medium') cls = 'bg-yellow-900/40 text-yellow-300'
  else if (i === 'low') cls = 'bg-green-900/40 text-green-300'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {impact}
    </span>
  )
}

function TrendIcon({ trend }: { trend: string }) {
  const t = (trend || '').toLowerCase()
  if (t.includes('up') || t.includes('+'))
    return <HiOutlineArrowTrendingUp className="w-4 h-4 text-green-400" />
  if (t.includes('down') || t.includes('-'))
    return <HiOutlineArrowTrendingDown className="w-4 h-4 text-red-400" />
  return <HiOutlineMinus className="w-4 h-4 text-muted-foreground" />
}

// ============================================================================
// Markdown Renderer
// ============================================================================

function renderMarkdown(text: string) {
  if (!text) return null
  const formatInline = (line: string) => {
    const parts = line.split(/\*\*(.*?)\*\*/g)
    if (parts.length === 1) return line
    return parts.map((part, i) =>
      i % 2 === 1 ? (
        <strong key={i} className="font-semibold text-foreground">
          {part}
        </strong>
      ) : (
        part
      )
    )
  }
  return (
    <div className="space-y-1.5">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return (
            <h4 key={i} className="font-semibold text-sm mt-3 mb-1 text-foreground">
              {line.slice(4)}
            </h4>
          )
        if (line.startsWith('## '))
          return (
            <h3 key={i} className="font-semibold text-base mt-3 mb-1 text-foreground">
              {line.slice(3)}
            </h3>
          )
        if (line.startsWith('# '))
          return (
            <h2 key={i} className="font-bold text-lg mt-4 mb-2 text-foreground">
              {line.slice(2)}
            </h2>
          )
        if (line.startsWith('- ') || line.startsWith('* '))
          return (
            <li key={i} className="ml-4 list-disc text-sm text-muted-foreground leading-relaxed">
              {formatInline(line.slice(2))}
            </li>
          )
        if (/^\d+\.\s/.test(line))
          return (
            <li key={i} className="ml-4 list-decimal text-sm text-muted-foreground leading-relaxed">
              {formatInline(line.replace(/^\d+\.\s/, ''))}
            </li>
          )
        if (!line.trim()) return <div key={i} className="h-1" />
        return (
          <p key={i} className="text-sm text-muted-foreground leading-relaxed">
            {formatInline(line)}
          </p>
        )
      })}
    </div>
  )
}

// ============================================================================
// Reusable Card
// ============================================================================

function Card({
  children,
  className = '',
  accent = false,
}: {
  children: React.ReactNode
  className?: string
  accent?: boolean
}) {
  return (
    <div
      className={`bg-card border rounded-lg p-5 ${accent ? 'border-accent/30' : 'border-border'} ${className}`}
    >
      {children}
    </div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-sm font-semibold tracking-wide text-foreground mb-3">{children}</h4>
  )
}

// ============================================================================
// Dashboard Tab
// ============================================================================

function DashboardTab({
  setActiveAgentId,
}: {
  setActiveAgentId: (id: string | null) => void
}) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const [queryHistory, setQueryHistory] = useState<string[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [copyFn, copied] = useCopyToClipboard()

  const handleAsk = useCallback(async () => {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setActiveAgentId(OPS_AGENT_ID)
    try {
      const res = await callAndParse(query, OPS_AGENT_ID)
      if (res.success) {
        setData(res.data)
        setQueryHistory((prev) => [query, ...prev.filter((q) => q !== query).slice(0, 9)])
      } else {
        setError(res.error || 'Failed to get response')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
      setActiveAgentId(null)
    }
  }, [query, setActiveAgentId])

  const statCards = [
    {
      label: 'Trips Today',
      value: '12,450',
      icon: <HiOutlineDocumentChartBar className="w-5 h-5" />,
      trend: '+12%',
      trendLabel: 'vs yesterday',
    },
    {
      label: 'Active Drivers',
      value: '3,210',
      icon: <HiOutlineUserGroup className="w-5 h-5" />,
      trend: '+5%',
      trendLabel: 'vs last week',
    },
    {
      label: 'Avg ETA',
      value: '4.2 min',
      icon: <HiOutlineClock className="w-5 h-5" />,
      trend: '-8%',
      trendLabel: 'improved',
    },
    {
      label: 'Revenue',
      value: '$48.2K',
      icon: <HiOutlineCurrencyDollar className="w-5 h-5" />,
      trend: '+15%',
      trendLabel: 'vs yesterday',
    },
  ]

  const metrics = Array.isArray(data?.key_metrics) ? data.key_metrics : []
  const recommendations = Array.isArray(data?.recommendations) ? data.recommendations : []

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className="bg-card border border-border rounded-lg p-4 hover:border-accent/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-muted-foreground">{card.icon}</span>
              <div className="flex items-center gap-1 text-xs">
                <TrendIcon trend={card.trend} />
                <span className="text-muted-foreground">{card.trend}</span>
              </div>
            </div>
            <p className="text-2xl font-semibold font-mono text-foreground tracking-tight">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Query Input */}
      <Card>
        <SectionHeading>Operations Intelligence</SectionHeading>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              className="w-full bg-input border border-border rounded-lg p-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all"
              rows={3}
              placeholder="Ask any operational question... (e.g., What were trip volumes in Cairo last week?)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleAsk()
                }
              }}
            />
            <FiSearch className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={handleAsk}
              disabled={loading || !query.trim()}
              className="px-5 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
            >
              {loading ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiSearch className="w-4 h-4" />}
              Ask
            </button>
            {queryHistory.length > 0 && (
              <button
                onClick={() => setHistoryOpen(!historyOpen)}
                className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg text-xs hover:opacity-90 transition-opacity flex items-center gap-1"
              >
                <HiOutlineClock className="w-3 h-3" />
                History
                {historyOpen ? (
                  <HiOutlineChevronUp className="w-3 h-3" />
                ) : (
                  <HiOutlineChevronDown className="w-3 h-3" />
                )}
              </button>
            )}
          </div>
        </div>
        {historyOpen && queryHistory.length > 0 && (
          <div className="mt-3 bg-secondary/50 rounded-lg p-3 space-y-1">
            <p className="text-xs font-medium text-muted-foreground mb-2">Recent Queries</p>
            {queryHistory.map((q, i) => (
              <button
                key={i}
                onClick={() => {
                  setQuery(q)
                  setHistoryOpen(false)
                }}
                className="block w-full text-left text-sm text-foreground hover:text-accent px-2 py-1.5 rounded-md hover:bg-muted transition-colors truncate"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </Card>

      {error && <StatusMessage type="error" message={error} onDismiss={() => setError(null)} />}

      {loading && (
        <Card>
          <SkeletonBlock />
        </Card>
      )}

      {!loading && data && (
        <div className="space-y-4">
          {data.answer && (
            <Card accent>
              <div className="flex items-start justify-between mb-3">
                <SectionHeading>Answer</SectionHeading>
                <button
                  onClick={() =>
                    copyFn(typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data))
                  }
                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <HiOutlineCheck className="w-4 h-4 text-green-400" />
                  ) : (
                    <HiOutlineClipboard className="w-4 h-4" />
                  )}
                </button>
              </div>
              {renderMarkdown(data.answer)}
            </Card>
          )}

          {metrics.length > 0 && (
            <div>
              <SectionHeading>Key Metrics</SectionHeading>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {metrics.map((m: any, i: number) => (
                  <div key={i} className="bg-card border border-border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground truncate">{m?.metric_name ?? 'Metric'}</span>
                      <TrendIcon trend={m?.trend ?? ''} />
                    </div>
                    <p className="text-lg font-semibold font-mono text-foreground">{m?.value ?? '-'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{m?.trend ?? ''}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.analysis && (
            <Card>
              <SectionHeading>Analysis</SectionHeading>
              {renderMarkdown(data.analysis)}
            </Card>
          )}

          {recommendations.length > 0 && (
            <Card>
              <SectionHeading>Recommendations</SectionHeading>
              <ol className="space-y-2.5">
                {recommendations.map((rec: string, i: number) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-medium mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-sm text-muted-foreground leading-relaxed">{rec}</span>
                  </li>
                ))}
              </ol>
            </Card>
          )}

          {data.data_source_note && (
            <p className="text-xs text-muted-foreground italic px-1 flex items-center gap-1.5">
              <HiOutlineInformationCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {data.data_source_note}
            </p>
          )}
        </div>
      )}

      {!loading && !data && (
        <Card className="!p-12 text-center">
          <HiOutlineChartBar className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-muted-foreground text-sm">Ask an operational question above to get AI-powered insights</p>
          <p className="text-xs text-muted-foreground mt-1.5 opacity-60">
            Try: "What is the average ETA in Cairo this week?" or "Compare trip volumes across cities"
          </p>
        </Card>
      )}
    </div>
  )
}

// ============================================================================
// Support Tab
// ============================================================================

function SupportTab({
  setActiveAgentId,
}: {
  setActiveAgentId: (id: string | null) => void
}) {
  const [form, setForm] = useState({ description: '', userType: '', issueHint: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const [draftedResponse, setDraftedResponse] = useState('')
  const [copyFn, copied] = useCopyToClipboard()

  useEffect(() => {
    if (data?.drafted_response) {
      setDraftedResponse(data.drafted_response)
    }
  }, [data])

  const handleTriage = useCallback(async () => {
    if (!form.description.trim()) return
    setLoading(true)
    setError(null)
    setActiveAgentId(SUPPORT_AGENT_ID)
    try {
      let message = form.description
      if (form.userType) message += `\nUser type: ${form.userType}`
      if (form.issueHint) message += `\nIssue category hint: ${form.issueHint}`
      const res = await callAndParse(message, SUPPORT_AGENT_ID)
      if (res.success) {
        setData(res.data)
      } else {
        setError(res.error || 'Triage failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
      setActiveAgentId(null)
    }
  }, [form, setActiveAgentId])

  const actions = Array.isArray(data?.internal_actions) ? data.internal_actions : []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Panel */}
      <div className="space-y-4">
        <Card>
          <SectionHeading>Submit Support Ticket</SectionHeading>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Issue Description <span className="text-accent">*</span>
              </label>
              <textarea
                className="w-full bg-input border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all"
                rows={6}
                placeholder="Describe the rider/driver issue in detail..."
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">User Type</label>
                <select
                  className="w-full bg-input border border-border rounded-lg p-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all"
                  value={form.userType}
                  onChange={(e) => setForm((prev) => ({ ...prev, userType: e.target.value }))}
                >
                  <option value="">Select...</option>
                  <option value="Rider">Rider</option>
                  <option value="Driver">Driver</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Issue Type Hint</label>
                <select
                  className="w-full bg-input border border-border rounded-lg p-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all"
                  value={form.issueHint}
                  onChange={(e) => setForm((prev) => ({ ...prev, issueHint: e.target.value }))}
                >
                  <option value="">Select...</option>
                  <option value="Payment">Payment</option>
                  <option value="Trip Quality">Trip Quality</option>
                  <option value="Driver Behavior">Driver Behavior</option>
                  <option value="Safety">Safety</option>
                  <option value="App Technical">App Technical</option>
                  <option value="Account">Account</option>
                  <option value="Cancellation">Cancellation</option>
                  <option value="Lost Item">Lost Item</option>
                  <option value="Promo/Discount">Promo/Discount</option>
                </select>
              </div>
            </div>
            <button
              onClick={handleTriage}
              disabled={loading || !form.description.trim()}
              className="w-full px-4 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiSend className="w-4 h-4" />}
              Triage & Draft Response
            </button>
          </div>
        </Card>
        {error && <StatusMessage type="error" message={error} onDismiss={() => setError(null)} />}
      </div>

      {/* Output Panel */}
      <div className="space-y-4">
        {loading && (
          <Card>
            <SkeletonBlock />
          </Card>
        )}

        {!loading && data && (
          <Card className="space-y-4">
            {/* Badges Row */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {data.category && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/20 text-accent border border-accent/30">
                  {data.category}
                </span>
              )}
              {data.severity && <SeverityBadge severity={data.severity} />}
              {data.priority_score != null && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                  Priority: {data.priority_score}/10
                </span>
              )}
              {data.estimated_resolution_time && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                  <HiOutlineClock className="w-3 h-3" /> {data.estimated_resolution_time}
                </span>
              )}
            </div>

            {data.summary && (
              <div>
                <SectionHeading>Summary</SectionHeading>
                {renderMarkdown(data.summary)}
              </div>
            )}

            {data.root_cause && (
              <div>
                <SectionHeading>Root Cause</SectionHeading>
                {renderMarkdown(data.root_cause)}
              </div>
            )}

            {/* Drafted Response */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <SectionHeading>Drafted Response</SectionHeading>
                <button
                  onClick={() => copyFn(draftedResponse || data?.drafted_response || '')}
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-xs"
                >
                  {copied ? (
                    <HiOutlineCheck className="w-3.5 h-3.5 text-green-400" />
                  ) : (
                    <FiCopy className="w-3.5 h-3.5" />
                  )}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <textarea
                className="w-full bg-input border border-border rounded-lg p-3 text-sm text-foreground resize-y min-h-[120px] focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all"
                rows={6}
                value={draftedResponse}
                onChange={(e) => setDraftedResponse(e.target.value)}
              />
            </div>

            {actions.length > 0 && (
              <div>
                <SectionHeading>Internal Actions</SectionHeading>
                <div className="space-y-2">
                  {actions.map((action: string, i: number) => (
                    <label
                      key={i}
                      className="flex items-start gap-2.5 text-sm text-muted-foreground cursor-pointer group"
                    >
                      <input type="checkbox" className="mt-0.5 accent-accent rounded" />
                      <span className="group-hover:text-foreground transition-colors leading-relaxed">
                        {action}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-border">
              <button
                onClick={() => copyFn(draftedResponse || data?.drafted_response || '')}
                className="px-3 py-1.5 bg-accent text-accent-foreground rounded-lg text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5"
              >
                <FiCopy className="w-3 h-3" /> Copy Response
              </button>
              <button
                onClick={handleTriage}
                disabled={loading || !form.description.trim()}
                className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5 disabled:opacity-40 border border-border"
              >
                <FiRefreshCw className="w-3 h-3" /> Regenerate
              </button>
            </div>
          </Card>
        )}

        {!loading && !data && (
          <Card className="!p-12 text-center">
            <HiOutlineChatBubbleLeftRight className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground text-sm">Submit a support ticket to see AI-powered triage results</p>
            <p className="text-xs text-muted-foreground mt-1.5 opacity-60">
              Issues are categorized by severity and drafted with professional responses
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Pricing Tab
// ============================================================================

function PricingTab({
  setActiveAgentId,
}: {
  setActiveAgentId: (id: string | null) => void
}) {
  const [form, setForm] = useState({
    city: 'Cairo',
    zone: '',
    startDate: '',
    endDate: '',
    rideType: 'Standard',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const [copyFn, copied] = useCopyToClipboard()

  const handleAnalyze = useCallback(async () => {
    setLoading(true)
    setError(null)
    setActiveAgentId(PRICING_AGENT_ID)
    try {
      let message = `Analyze surge pricing for ${form.city}`
      if (form.zone) message += `, zone: ${form.zone}`
      if (form.startDate && form.endDate) message += `, period: ${form.startDate} to ${form.endDate}`
      else if (form.startDate) message += `, from: ${form.startDate}`
      message += `, ride type: ${form.rideType}`

      const res = await callAndParse(message, PRICING_AGENT_ID)
      if (res.success) {
        setData(res.data)
      } else {
        setError(res.error || 'Analysis failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
      setActiveAgentId(null)
    }
  }, [form, setActiveAgentId])

  const cities = ['Cairo', 'Riyadh', 'Dubai', 'Jeddah', 'Alexandria', 'Doha']
  const rideTypes = ['Standard', 'Premium', 'Economy', 'XL']
  const peakPeriods = Array.isArray(data?.peak_periods) ? data.peak_periods : []
  const recommendations = Array.isArray(data?.recommendations) ? data.recommendations : []

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <Card>
        <SectionHeading>Surge Pricing Analysis</SectionHeading>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-40">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">City</label>
            <select
              className="w-full bg-input border border-border rounded-lg p-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
              value={form.city}
              onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
            >
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="w-36">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Zone</label>
            <input
              type="text"
              className="w-full bg-input border border-border rounded-lg p-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
              placeholder="e.g., Downtown"
              value={form.zone}
              onChange={(e) => setForm((prev) => ({ ...prev, zone: e.target.value }))}
            />
          </div>
          <div className="w-40">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Start Date</label>
            <input
              type="date"
              className="w-full bg-input border border-border rounded-lg p-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
              value={form.startDate}
              onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
            />
          </div>
          <div className="w-40">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">End Date</label>
            <input
              type="date"
              className="w-full bg-input border border-border rounded-lg p-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
              value={form.endDate}
              onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Ride Type</label>
            <div className="flex gap-1">
              {rideTypes.map((rt) => (
                <button
                  key={rt}
                  onClick={() => setForm((prev) => ({ ...prev, rideType: rt }))}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    form.rideType === rt
                      ? 'bg-accent text-accent-foreground shadow-sm'
                      : 'bg-secondary text-secondary-foreground hover:bg-muted'
                  }`}
                >
                  {rt}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="px-5 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
          >
            {loading ? <FiLoader className="w-4 h-4 animate-spin" /> : <HiOutlineBolt className="w-4 h-4" />}
            Analyze Pricing
          </button>
        </div>
      </Card>

      {error && <StatusMessage type="error" message={error} onDismiss={() => setError(null)} />}

      {loading && (
        <Card>
          <SkeletonBlock />
        </Card>
      )}

      {!loading && data && (
        <div className="space-y-4">
          {/* Surge Summary */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <div>
                <SectionHeading>Surge Summary</SectionHeading>
                {data.city && (
                  <p className="text-xs text-muted-foreground -mt-2">
                    {data.city} -- {data.analysis_period || 'Current period'}
                  </p>
                )}
              </div>
              <button
                onClick={() => copyFn(JSON.stringify(data, null, 2))}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                {copied ? (
                  <HiOutlineCheck className="w-4 h-4 text-green-400" />
                ) : (
                  <HiOutlineClipboard className="w-4 h-4" />
                )}
              </button>
            </div>
            {renderMarkdown(data.surge_summary || '')}
          </Card>

          {/* Peak Periods Table */}
          {peakPeriods.length > 0 && (
            <Card>
              <SectionHeading>Peak Periods</SectionHeading>
              <div className="overflow-x-auto -mx-5 px-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Period
                      </th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Surge Multiplier
                      </th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Demand Level
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {peakPeriods.map((pp: any, i: number) => (
                      <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors">
                        <td className="py-2.5 px-3 text-foreground">{pp?.period ?? '-'}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-accent">
                          {pp?.surge_multiplier ?? '-'}
                        </td>
                        <td className="py-2.5 px-3">
                          <SeverityBadge severity={pp?.demand_level ?? ''} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {data.revenue_impact && (
            <Card>
              <SectionHeading>Revenue Impact</SectionHeading>
              {renderMarkdown(data.revenue_impact)}
            </Card>
          )}

          {data.supply_demand_analysis && (
            <Card>
              <SectionHeading>Supply-Demand Analysis</SectionHeading>
              {renderMarkdown(data.supply_demand_analysis)}
            </Card>
          )}

          {recommendations.length > 0 && (
            <div>
              <SectionHeading>Recommendations</SectionHeading>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {recommendations.map((rec: any, i: number) => (
                  <div
                    key={i}
                    className="bg-card border border-border rounded-lg p-4 hover:border-accent/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-semibold text-foreground">
                        {rec?.title ?? `Recommendation ${i + 1}`}
                      </h5>
                      {rec?.priority && <SeverityBadge severity={rec.priority} />}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{rec?.description ?? ''}</p>
                    {rec?.impact && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">Impact:</span>
                        <ImpactBadge impact={rec.impact} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && !data && (
        <Card className="!p-12 text-center">
          <HiOutlineCurrencyDollar className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-muted-foreground text-sm">Configure filters and analyze surge pricing patterns</p>
          <p className="text-xs text-muted-foreground mt-1.5 opacity-60">
            Get AI-powered pricing optimization recommendations for any city and zone
          </p>
        </Card>
      )}
    </div>
  )
}

// ============================================================================
// Compliance Tab
// ============================================================================

function ComplianceTab({
  setActiveAgentId,
}: {
  setActiveAgentId: (id: string | null) => void
}) {
  const [form, setForm] = useState({
    driverName: '',
    docType: '',
    expiryDate: '',
    vehicleAge: '',
    vehicleModel: '',
    region: 'Cairo',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const [copyFn, copied] = useCopyToClipboard()

  const handleReview = useCallback(async () => {
    if (!form.driverName.trim()) return
    setLoading(true)
    setError(null)
    setActiveAgentId(COMPLIANCE_AGENT_ID)
    try {
      let message = `Review compliance for driver: ${form.driverName}`
      if (form.docType) message += `\nDocument type: ${form.docType}`
      if (form.expiryDate) message += `\nExpiry date: ${form.expiryDate}`
      if (form.vehicleAge) message += `\nVehicle age: ${form.vehicleAge} years`
      if (form.vehicleModel) message += `\nVehicle model: ${form.vehicleModel}`
      if (form.region) message += `\nRegion: ${form.region}`
      if (form.notes) message += `\nAdditional notes: ${form.notes}`

      const res = await callAndParse(message, COMPLIANCE_AGENT_ID)
      if (res.success) {
        setData(res.data)
      } else {
        setError(res.error || 'Review failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
      setActiveAgentId(null)
    }
  }, [form, setActiveAgentId])

  const docTypes = [
    'Driver License',
    'Vehicle Registration',
    'Insurance Certificate',
    'Background Check',
    'Vehicle Inspection',
    'Profile Photo',
  ]
  const regions = ['Cairo', 'Riyadh', 'Dubai', 'Jeddah', 'Alexandria', 'Doha']
  const checks = Array.isArray(data?.checks) ? data.checks : []
  const flags = Array.isArray(data?.flags) ? data.flags : []
  const expiryAlerts = Array.isArray(data?.expiry_alerts) ? data.expiry_alerts : []
  const recActions = Array.isArray(data?.recommended_actions) ? data.recommended_actions : []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Form */}
      <div>
        <Card>
          <SectionHeading>Driver Compliance Review</SectionHeading>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Driver Name <span className="text-accent">*</span>
              </label>
              <input
                type="text"
                className="w-full bg-input border border-border rounded-lg p-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                placeholder="Enter driver full name"
                value={form.driverName}
                onChange={(e) => setForm((prev) => ({ ...prev, driverName: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Document Type</label>
                <select
                  className="w-full bg-input border border-border rounded-lg p-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                  value={form.docType}
                  onChange={(e) => setForm((prev) => ({ ...prev, docType: e.target.value }))}
                >
                  <option value="">All Documents</option>
                  {docTypes.map((dt) => (
                    <option key={dt} value={dt}>
                      {dt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Expiry Date</label>
                <input
                  type="date"
                  className="w-full bg-input border border-border rounded-lg p-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                  value={form.expiryDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, expiryDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Vehicle Age (years)
                </label>
                <input
                  type="number"
                  className="w-full bg-input border border-border rounded-lg p-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                  placeholder="e.g., 3"
                  value={form.vehicleAge}
                  onChange={(e) => setForm((prev) => ({ ...prev, vehicleAge: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Vehicle Model</label>
                <input
                  type="text"
                  className="w-full bg-input border border-border rounded-lg p-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                  placeholder="e.g., Toyota Camry 2022"
                  value={form.vehicleModel}
                  onChange={(e) => setForm((prev) => ({ ...prev, vehicleModel: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Region</label>
              <select
                className="w-full bg-input border border-border rounded-lg p-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                value={form.region}
                onChange={(e) => setForm((prev) => ({ ...prev, region: e.target.value }))}
              >
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Additional Notes</label>
              <textarea
                className="w-full bg-input border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                rows={3}
                placeholder="Any additional information about the submission..."
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            <button
              onClick={handleReview}
              disabled={loading || !form.driverName.trim()}
              className="w-full px-4 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <FiLoader className="w-4 h-4 animate-spin" />
              ) : (
                <HiOutlineShieldCheck className="w-4 h-4" />
              )}
              Review Documents
            </button>
          </div>
          {error && (
            <div className="mt-4">
              <StatusMessage type="error" message={error} onDismiss={() => setError(null)} />
            </div>
          )}
        </Card>
      </div>

      {/* Output Panel */}
      <div className="space-y-4">
        {loading && (
          <Card>
            <SkeletonBlock />
          </Card>
        )}

        {!loading && data && (
          <div className="space-y-4">
            {/* Header with verdict */}
            <Card>
              <div className="flex items-start justify-between mb-3">
                <div className="space-y-2">
                  <h4 className="text-base font-semibold text-foreground">
                    {data.driver_name || 'Driver'}
                  </h4>
                  {data.verdict && <VerdictBadge verdict={data.verdict} />}
                </div>
                <button
                  onClick={() => copyFn(JSON.stringify(data, null, 2))}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  {copied ? (
                    <HiOutlineCheck className="w-4 h-4 text-green-400" />
                  ) : (
                    <HiOutlineClipboard className="w-4 h-4" />
                  )}
                </button>
              </div>
              {data.review_summary && <div className="mt-3">{renderMarkdown(data.review_summary)}</div>}
            </Card>

            {/* Validation Checklist */}
            {checks.length > 0 && (
              <Card>
                <SectionHeading>Validation Checklist</SectionHeading>
                <div className="space-y-2">
                  {checks.map((check: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-secondary/30">
                      <CheckStatusIcon status={check?.status ?? ''} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {check?.check_name ?? 'Check'}
                          </span>
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded ${
                              (check?.status || '').toLowerCase() === 'pass'
                                ? 'bg-green-900/30 text-green-300'
                                : (check?.status || '').toLowerCase() === 'fail'
                                ? 'bg-red-900/30 text-red-300'
                                : 'bg-yellow-900/30 text-yellow-300'
                            }`}
                          >
                            {check?.status ?? ''}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {check?.details ?? ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {flags.length > 0 && (
              <Card>
                <SectionHeading>Flags</SectionHeading>
                <div className="space-y-2">
                  {flags.map((flag: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <HiOutlineExclamationTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground leading-relaxed">{flag}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {expiryAlerts.length > 0 && (
              <Card>
                <SectionHeading>Expiry Alerts</SectionHeading>
                <div className="space-y-2">
                  {expiryAlerts.map((alert: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <HiOutlineClock className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground leading-relaxed">{alert}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {recActions.length > 0 && (
              <Card>
                <SectionHeading>Recommended Actions</SectionHeading>
                <ol className="space-y-2">
                  {recActions.map((action: string, i: number) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-medium mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-sm text-muted-foreground leading-relaxed">{action}</span>
                    </li>
                  ))}
                </ol>
              </Card>
            )}

            {data.reasoning && (
              <Card>
                <SectionHeading>Detailed Reasoning</SectionHeading>
                {renderMarkdown(data.reasoning)}
              </Card>
            )}
          </div>
        )}

        {!loading && !data && (
          <Card className="!p-12 text-center">
            <HiOutlineShieldCheck className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground text-sm">Enter driver details to review compliance</p>
            <p className="text-xs text-muted-foreground mt-1.5 opacity-60">
              Documents are validated against regulatory requirements with detailed reasoning
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Reports Tab
// ============================================================================

function ReportsTab({
  setActiveAgentId,
}: {
  setActiveAgentId: (id: string | null) => void
}) {
  const [form, setForm] = useState({
    reportType: 'Weekly Ops',
    startDate: '',
    endDate: '',
    recipientEmail: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const [copyFn, copied] = useCopyToClipboard()
  const [statusMsg, setStatusMsg] = useState<{
    type: 'success' | 'error' | 'warning' | 'info'
    text: string
  } | null>(null)

  // Schedule state
  const [scheduleId, setScheduleId] = useState(INITIAL_SCHEDULE_ID)
  const [scheduleData, setScheduleData] = useState<Schedule | null>(null)
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [scheduleEmail, setScheduleEmail] = useState('')
  const [scheduleEmailSaved, setScheduleEmailSaved] = useState(false)
  const [logs, setLogs] = useState<ExecutionLog[]>([])

  const reportTypes = ['Weekly Ops', 'Financial Summary', 'City Performance', 'Driver Metrics']

  // Load schedule on mount
  const loadSchedules = useCallback(async () => {
    setScheduleLoading(true)
    try {
      const result = await listSchedules({ agentId: REPORT_AGENT_ID })
      if (result.success && Array.isArray(result.schedules) && result.schedules.length > 0) {
        const found = result.schedules.find((s) => s.id === scheduleId) || result.schedules[0]
        setScheduleData(found)
        setScheduleId(found.id)
        const msgMatch = (found.message || '').match(/email\s+to:\s*(\S+)/i)
        if (msgMatch) {
          setScheduleEmail(msgMatch[1])
          setScheduleEmailSaved(true)
        }
      }
    } catch {
      // silent
    } finally {
      setScheduleLoading(false)
    }
  }, [scheduleId])

  useEffect(() => {
    loadSchedules()
  }, [loadSchedules])

  const loadLogs = useCallback(async () => {
    if (!scheduleId) return
    try {
      const result = await getScheduleLogs(scheduleId, { limit: 5 })
      if (result.success) {
        setLogs(Array.isArray(result.executions) ? result.executions : [])
      }
    } catch {
      // silent
    }
  }, [scheduleId])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  const handleGenerate = useCallback(async () => {
    setLoading(true)
    setError(null)
    setStatusMsg(null)
    setActiveAgentId(REPORT_AGENT_ID)
    try {
      let message = `Generate a ${form.reportType} report`
      if (form.startDate && form.endDate) message += ` for the period ${form.startDate} to ${form.endDate}`
      const res = await callAndParse(message, REPORT_AGENT_ID)
      if (res.success) {
        setData(res.data)
        setStatusMsg({ type: 'success', text: 'Report generated successfully' })
      } else {
        setError(res.error || 'Report generation failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
      setActiveAgentId(null)
    }
  }, [form, setActiveAgentId])

  const handleEmailReport = useCallback(async () => {
    if (!form.recipientEmail.trim()) {
      setStatusMsg({ type: 'warning', text: 'Please enter a recipient email address' })
      return
    }
    setLoading(true)
    setError(null)
    setStatusMsg(null)
    setActiveAgentId(REPORT_AGENT_ID)
    try {
      let message = `Generate a ${form.reportType} report`
      if (form.startDate && form.endDate) message += ` for the period ${form.startDate} to ${form.endDate}`
      message += `. Send via email to: ${form.recipientEmail}`
      const res = await callAndParse(message, REPORT_AGENT_ID)
      if (res.success) {
        setData(res.data)
        setStatusMsg({ type: 'success', text: `Report generated and sent to ${form.recipientEmail}` })
      } else {
        setError(res.error || 'Email delivery failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
      setActiveAgentId(null)
    }
  }, [form, setActiveAgentId])

  const handleSaveScheduleEmail = useCallback(async () => {
    if (!scheduleEmail.trim()) {
      setStatusMsg({ type: 'warning', text: 'Please enter an email address for scheduled reports' })
      return
    }
    setScheduleLoading(true)
    setStatusMsg(null)
    try {
      const newMsg = `Generate the HiyatCab Weekly Operations Report and send via email to: ${scheduleEmail}`
      const result = await updateScheduleMessage(scheduleId, newMsg)
      if (result.success && result.newScheduleId) {
        setScheduleId(result.newScheduleId)
        setScheduleEmailSaved(true)
        setStatusMsg({ type: 'success', text: 'Recipient email saved to schedule' })
        await loadSchedules()
      } else {
        setStatusMsg({ type: 'error', text: result.error || 'Failed to update schedule email' })
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Failed to update schedule' })
    } finally {
      setScheduleLoading(false)
    }
  }, [scheduleId, scheduleEmail, loadSchedules])

  const handleToggleSchedule = useCallback(async () => {
    if (!scheduleData) return
    if (!scheduleData.is_active && !scheduleEmailSaved) {
      setStatusMsg({
        type: 'warning',
        text: 'Please enter and save a recipient email before activating the schedule',
      })
      return
    }
    setScheduleLoading(true)
    setStatusMsg(null)
    try {
      if (scheduleData.is_active) {
        await pauseSchedule(scheduleId)
        setStatusMsg({ type: 'info', text: 'Schedule paused' })
      } else {
        await resumeSchedule(scheduleId)
        setStatusMsg({ type: 'success', text: 'Schedule activated successfully' })
      }
      await loadSchedules()
    } catch {
      setStatusMsg({ type: 'error', text: 'Failed to toggle schedule' })
    } finally {
      setScheduleLoading(false)
    }
  }, [scheduleData, scheduleId, scheduleEmailSaved, loadSchedules])

  const execSummary = Array.isArray(data?.executive_summary) ? data.executive_summary : []
  const keyMetrics = Array.isArray(data?.key_metrics) ? data.key_metrics : []
  const sections = Array.isArray(data?.sections) ? data.sections : []
  const recommendations = Array.isArray(data?.recommendations) ? data.recommendations : []

  return (
    <div className="space-y-6">
      {/* Report Generator */}
      <Card>
        <SectionHeading>Generate Report</SectionHeading>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Report Type</label>
            <div className="flex gap-1.5 flex-wrap">
              {reportTypes.map((rt) => (
                <button
                  key={rt}
                  onClick={() => setForm((prev) => ({ ...prev, reportType: rt }))}
                  className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    form.reportType === rt
                      ? 'bg-accent text-accent-foreground shadow-sm'
                      : 'bg-secondary text-secondary-foreground hover:bg-muted'
                  }`}
                >
                  {rt}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-40">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Start Date</label>
              <input
                type="date"
                className="w-full bg-input border border-border rounded-lg p-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                value={form.startDate}
                onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div className="w-40">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">End Date</label>
              <input
                type="date"
                className="w-full bg-input border border-border rounded-lg p-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                value={form.endDate}
                onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <div className="flex-1 min-w-[220px]">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Recipient Email
              </label>
              <input
                type="email"
                className="w-full bg-input border border-border rounded-lg p-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                placeholder="ops-team@hiyatcab.com"
                value={form.recipientEmail}
                onChange={(e) => setForm((prev) => ({ ...prev, recipientEmail: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-5 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
            >
              {loading ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiFileText className="w-4 h-4" />}
              Generate Report
            </button>
            <button
              onClick={handleEmailReport}
              disabled={loading || !form.recipientEmail.trim()}
              className="px-5 py-2.5 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 border border-border"
            >
              {loading ? (
                <FiLoader className="w-4 h-4 animate-spin" />
              ) : (
                <HiOutlineEnvelope className="w-4 h-4" />
              )}
              Email Report
            </button>
          </div>
        </div>
      </Card>

      {error && <StatusMessage type="error" message={error} onDismiss={() => setError(null)} />}
      {statusMsg && (
        <StatusMessage type={statusMsg.type} message={statusMsg.text} onDismiss={() => setStatusMsg(null)} />
      )}

      {loading && (
        <Card>
          <SkeletonBlock rows={8} />
        </Card>
      )}

      {!loading && data && (
        <div className="space-y-4">
          {/* Report Header */}
          <Card>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-foreground">
                  {data.report_title || 'Report'}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.report_type || ''} -- {data.period || ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyFn(JSON.stringify(data, null, 2))}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                  title="Copy report"
                >
                  {copied ? (
                    <HiOutlineCheck className="w-4 h-4 text-green-400" />
                  ) : (
                    <HiOutlineClipboard className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {data.email_status && (
              <div className="mb-4 flex items-center gap-2 text-xs bg-green-900/20 text-green-300 px-3 py-2 rounded-lg">
                <HiOutlineEnvelope className="w-3.5 h-3.5" />
                <span>{data.email_status}</span>
              </div>
            )}

            {execSummary.length > 0 && (
              <div>
                <h5 className="text-sm font-semibold text-foreground mb-2">Executive Summary</h5>
                <ul className="space-y-1.5">
                  {execSummary.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <FiChevronRight className="w-3 h-3 text-accent flex-shrink-0 mt-1" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          {/* Key Metrics Grid */}
          {keyMetrics.length > 0 && (
            <div>
              <SectionHeading>Key Metrics</SectionHeading>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {keyMetrics.map((m: any, i: number) => (
                  <div
                    key={i}
                    className="bg-card border border-border rounded-lg p-3 hover:border-accent/30 transition-colors"
                  >
                    <p className="text-xs text-muted-foreground">{m?.metric ?? 'Metric'}</p>
                    <p className="text-lg font-semibold font-mono text-foreground mt-1">{m?.value ?? '-'}</p>
                    {m?.change && (
                      <div className="flex items-center gap-1 mt-1">
                        <TrendIcon trend={m.change} />
                        <span className="text-xs text-muted-foreground">{m.change}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Report Sections */}
          {sections.length > 0 && (
            <div className="space-y-3">
              {sections.map((sec: any, i: number) => (
                <Card key={i}>
                  <h5 className="text-sm font-semibold text-foreground mb-2">
                    {sec?.title ?? `Section ${i + 1}`}
                  </h5>
                  {renderMarkdown(sec?.content ?? '')}
                </Card>
              ))}
            </div>
          )}

          {recommendations.length > 0 && (
            <Card>
              <SectionHeading>Recommendations</SectionHeading>
              <ol className="space-y-2.5">
                {recommendations.map((rec: string, i: number) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-medium mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-sm text-muted-foreground leading-relaxed">{rec}</span>
                  </li>
                ))}
              </ol>
            </Card>
          )}
        </div>
      )}

      {!loading && !data && (
        <Card className="!p-12 text-center">
          <HiOutlineDocumentText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-muted-foreground text-sm">Configure report parameters above and generate</p>
          <p className="text-xs text-muted-foreground mt-1.5 opacity-60">
            Reports can be generated on-demand or automatically via the schedule below
          </p>
        </Card>
      )}

      {/* Schedule Management */}
      <Card accent>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center">
            <HiOutlineCalendarDays className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Automated Weekly Report</h3>
            <p className="text-xs text-muted-foreground">Scheduled report delivery via Gmail</p>
          </div>
        </div>

        {scheduleLoading && !scheduleData && (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-10 bg-muted rounded w-1/3" />
          </div>
        )}

        {scheduleData && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-secondary/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-0.5">Schedule</p>
                <p className="text-sm font-medium text-foreground">
                  {cronToHuman(scheduleData.cron_expression)}
                </p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-0.5">Timezone</p>
                <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <HiOutlineGlobeAlt className="w-3.5 h-3.5 text-muted-foreground" />
                  {scheduleData.timezone || 'UTC'}
                </p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-0.5">Status</p>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      scheduleData.is_active ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
                    }`}
                  />
                  <p className="text-sm font-medium text-foreground">
                    {scheduleData.is_active ? 'Active' : 'Paused'}
                  </p>
                </div>
              </div>
            </div>

            {scheduleData.next_run_time && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <HiOutlineClock className="w-3.5 h-3.5" />
                Next run: {new Date(scheduleData.next_run_time).toLocaleString()}
              </p>
            )}

            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Recipient Email for Scheduled Reports
                </label>
                <input
                  type="email"
                  className="w-full bg-input border border-border rounded-lg p-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                  placeholder="ops-team@hiyatcab.com"
                  value={scheduleEmail}
                  onChange={(e) => {
                    setScheduleEmail(e.target.value)
                    setScheduleEmailSaved(false)
                  }}
                />
              </div>
              <button
                onClick={handleSaveScheduleEmail}
                disabled={scheduleLoading || !scheduleEmail.trim()}
                className="px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 border border-border"
              >
                {scheduleLoading ? (
                  <FiLoader className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <HiOutlineCheck className="w-3.5 h-3.5" />
                )}
                Save
              </button>
            </div>

            {scheduleEmailSaved && (
              <p className="text-xs text-green-400 flex items-center gap-1">
                <FiCheckCircle className="w-3 h-3" /> Email saved to schedule
              </p>
            )}

            <button
              onClick={handleToggleSchedule}
              disabled={scheduleLoading}
              className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                scheduleData.is_active
                  ? 'bg-secondary text-secondary-foreground border border-border hover:opacity-90'
                  : 'bg-accent text-accent-foreground hover:opacity-90 shadow-sm'
              }`}
            >
              {scheduleLoading ? (
                <FiLoader className="w-4 h-4 animate-spin" />
              ) : scheduleData.is_active ? (
                <>
                  <HiOutlinePause className="w-4 h-4" /> Pause Schedule
                </>
              ) : (
                <>
                  <HiOutlinePlay className="w-4 h-4" /> Activate Schedule
                </>
              )}
            </button>

            {/* Execution Logs */}
            {logs.length > 0 && (
              <div className="mt-2">
                <h5 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                  Recent Executions
                </h5>
                <div className="space-y-1.5">
                  {logs.map((log, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs bg-secondary/30 rounded-lg p-2.5"
                    >
                      {log.success ? (
                        <FiCheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                      ) : (
                        <FiXCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                      )}
                      <span className="text-muted-foreground">
                        {new Date(log.executed_at).toLocaleString()}
                      </span>
                      <span className={`ml-auto font-medium ${log.success ? 'text-green-400' : 'text-red-400'}`}>
                        {log.success ? 'Success' : 'Failed'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!scheduleData && !scheduleLoading && (
          <p className="text-sm text-muted-foreground">
            Schedule configuration not available. Refresh to retry.
          </p>
        )}
      </Card>
    </div>
  )
}

// ============================================================================
// Agent Status Indicator
// ============================================================================

function AgentStatusPanel({ activeAgentId }: { activeAgentId: string | null }) {
  const agents = [
    { id: OPS_AGENT_ID, name: 'Ops Intelligence', shortName: 'OPS' },
    { id: SUPPORT_AGENT_ID, name: 'Support Triage', shortName: 'SUP' },
    { id: PRICING_AGENT_ID, name: 'Pricing Analyst', shortName: 'PRC' },
    { id: COMPLIANCE_AGENT_ID, name: 'Compliance', shortName: 'CMP' },
    { id: REPORT_AGENT_ID, name: 'Report Gen', shortName: 'RPT' },
  ]

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-1 mb-2">
        AI Agents
      </p>
      {agents.map((agent) => (
        <div
          key={agent.id}
          className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${
            activeAgentId === agent.id ? 'bg-accent/10 text-accent' : 'text-muted-foreground'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              activeAgentId === agent.id ? 'bg-green-400 animate-pulse' : 'bg-muted-foreground/30'
            }`}
          />
          <span className="truncate">{agent.name}</span>
          {activeAgentId === agent.id && (
            <FiLoader className="w-3 h-3 animate-spin ml-auto flex-shrink-0" />
          )}
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function HiyatCabPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard')
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const tabTitles: Record<TabKey, string> = {
    dashboard: 'Operations Dashboard',
    support: 'Support Triage',
    pricing: 'Pricing & Surge Analysis',
    compliance: 'Compliance Review',
    reports: 'Reports & Scheduling',
  }

  const tabDescriptions: Record<TabKey, string> = {
    dashboard: 'Real-time operational metrics and AI-powered intelligence',
    support: 'Automated ticket triage and response drafting',
    pricing: 'Surge pattern analysis and pricing optimization',
    compliance: 'Driver document review and regulatory validation',
    reports: 'Automated report generation and scheduled delivery',
  }

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab)
    setMobileSidebarOpen(false)
  }

  return (
    <PageErrorBoundary>
      <div className="min-h-screen bg-background text-foreground flex">
        {/* Mobile Overlay */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed left-0 top-0 h-full bg-[hsl(20,28%,6%)] border-r border-[hsl(20,18%,12%)] flex flex-col z-50 transition-all duration-300 ease-in-out
            ${mobileSidebarOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0'}
            ${sidebarOpen ? 'lg:w-64' : 'lg:w-0 lg:overflow-hidden'}
          `}
        >
          {/* Brand Header */}
          <div className="p-4 border-b border-[hsl(20,18%,12%)]">
            <div className="flex items-center gap-3">
              <HiyatCabLogo size={40} />
              <div>
                <h1 className="text-base font-semibold tracking-wide text-foreground">HiyatCab</h1>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                  Operations Platform
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-[hsl(20,18%,12%)] text-accent shadow-sm'
                    : 'text-[hsl(35,20%,90%)] hover:bg-[hsl(20,18%,12%)]/60 hover:text-foreground'
                }`}
              >
                {tab.icon}
                {tab.label}
                {activeTab === tab.key && (
                  <div className="ml-auto w-1 h-4 bg-accent rounded-full" />
                )}
              </button>
            ))}
          </nav>

          {/* Agent Status */}
          <div className="p-3 border-t border-[hsl(20,18%,12%)]">
            <AgentStatusPanel activeAgentId={activeAgentId} />
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-[hsl(20,18%,12%)]">
            <p className="text-[10px] text-muted-foreground text-center tracking-wide">
              HiyatCab v1.0
            </p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main
          className={`flex-1 min-h-screen transition-all duration-300 ease-in-out ${
            sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
          }`}
        >
          {/* Top Header */}
          <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3">
              <div className="flex items-center gap-3">
                {/* Mobile menu button */}
                <button
                  onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground lg:hidden"
                >
                  <HiOutlineBars3 className="w-5 h-5" />
                </button>
                {/* Desktop sidebar toggle */}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground hidden lg:block"
                >
                  <HiOutlineBars3 className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-lg font-semibold tracking-wide text-foreground">
                    {tabTitles[activeTab]}
                  </h2>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    {tabDescriptions[activeTab]}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Mobile logo */}
                <div className="lg:hidden">
                  <HiyatCabLogoSmall />
                </div>
                {activeAgentId && (
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-full text-xs text-accent">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    Processing...
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="p-4 sm:p-6 max-w-[1600px]">
            {activeTab === 'dashboard' && (
              <DashboardTab setActiveAgentId={setActiveAgentId} />
            )}
            {activeTab === 'support' && (
              <SupportTab setActiveAgentId={setActiveAgentId} />
            )}
            {activeTab === 'pricing' && (
              <PricingTab setActiveAgentId={setActiveAgentId} />
            )}
            {activeTab === 'compliance' && (
              <ComplianceTab setActiveAgentId={setActiveAgentId} />
            )}
            {activeTab === 'reports' && (
              <ReportsTab setActiveAgentId={setActiveAgentId} />
            )}
          </div>
        </main>
      </div>
    </PageErrorBoundary>
  )
}
