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
import { HiOutlineChartBar, HiOutlineChatBubbleLeftRight, HiOutlineDocumentText, HiOutlineShieldCheck, HiOutlineCurrencyDollar, HiOutlineClock, HiOutlineChevronDown, HiOutlineChevronUp, HiOutlineArrowPath, HiOutlineCheck, HiOutlineXMark, HiOutlineExclamationTriangle, HiOutlineInformationCircle, HiOutlineClipboard, HiOutlineEnvelope, HiOutlinePlay, HiOutlinePause, HiOutlineBolt, HiOutlineUserGroup, HiOutlineMapPin, HiOutlineTruck, HiOutlineArrowTrendingUp, HiOutlineArrowTrendingDown, HiOutlineMinus } from 'react-icons/hi2'
import { FiSearch, FiSend, FiLoader, FiCalendar, FiUser, FiFileText, FiAlertCircle, FiCheckCircle, FiXCircle, FiCopy, FiRefreshCw, FiChevronRight } from 'react-icons/fi'

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

const AGENTS_INFO = [
  { id: OPS_AGENT_ID, name: 'Ops Intelligence', purpose: 'Operational analytics and insights' },
  { id: SUPPORT_AGENT_ID, name: 'Support Triage', purpose: 'Ticket classification and response drafting' },
  { id: PRICING_AGENT_ID, name: 'Pricing & Surge Analyst', purpose: 'Surge pricing analysis and optimization' },
  { id: COMPLIANCE_AGENT_ID, name: 'Compliance Review', purpose: 'Driver document and regulatory checks' },
  { id: REPORT_AGENT_ID, name: 'Report Generator', purpose: 'Automated operations reports with email delivery' },
]

const SAMPLE_DASHBOARD_DATA = {
  answer: 'Based on current operational data, HiyatCab is performing strongly across all key metrics. Trip volume is up 12% week-over-week with particularly strong growth in the Cairo and Riyadh markets. Driver utilization rates are healthy at 78%, though there is room for improvement in Alexandria during off-peak hours.',
  key_metrics: [
    { metric_name: 'Total Trips (Today)', value: '12,450', trend: 'up 12%' },
    { metric_name: 'Active Drivers', value: '3,210', trend: 'up 5%' },
    { metric_name: 'Average ETA', value: '4.2 min', trend: 'down 8%' },
    { metric_name: 'Revenue (Today)', value: '$48.2K', trend: 'up 15%' },
  ],
  analysis: 'Peak demand windows are shifting earlier in Cairo (5:30 PM vs previous 6:15 PM), suggesting changing commuter patterns. Riyadh continues to show premium ride preference growth at +18% MoM. Driver churn in Q4 was 6.2%, below the 8% industry benchmark.',
  recommendations: [
    'Increase driver incentives in Alexandria during 2-5 PM to improve coverage',
    'Consider expanding Premium fleet in Riyadh by 15% to meet demand',
    'Implement dynamic ETA adjustments for Cairo evening rush',
    'Launch targeted retention program for drivers with 6+ months tenure',
  ],
  data_source_note: 'Data sourced from HiyatCab Operations DB, updated as of the last sync cycle.',
}

const SAMPLE_SUPPORT_DATA = {
  category: 'Payment Issue',
  severity: 'Medium',
  root_cause: 'Double charge occurred due to a network timeout during payment processing. The rider was charged twice for trip #HC-28451 on Jan 15. The payment gateway confirmed duplicate transaction IDs.',
  summary: 'Rider reported being charged twice for a single trip from Downtown Cairo to Maadi. Total overcharge amount: EGP 145.',
  drafted_response: 'Dear valued rider,\n\nThank you for bringing this to our attention. We have identified the duplicate charge on your account for trip #HC-28451. A refund of EGP 145 has been initiated and will be reflected in your account within 3-5 business days.\n\nWe sincerely apologize for the inconvenience. As a gesture of goodwill, we have added a 20% discount code (SORRY20) for your next ride.\n\nBest regards,\nHiyatCab Support Team',
  internal_actions: [
    'Process refund of EGP 145 via payment gateway',
    'Flag payment gateway timeout pattern for engineering review',
    'Apply SORRY20 discount code to rider account',
    'Log incident in payment reliability tracker',
  ],
  priority_score: 7,
  estimated_resolution_time: '24-48 hours',
}

const SAMPLE_PRICING_DATA = {
  city: 'Cairo',
  analysis_period: 'January 1-31, 2025',
  surge_summary: 'Cairo experienced moderate surge activity during January with an average multiplier of 1.4x during peak hours. Major surge events correlated with weather disruptions (3 rainy days) and a national holiday weekend.',
  peak_periods: [
    { period: 'Weekday Morning Rush (7:00-9:30 AM)', surge_multiplier: '1.6x', demand_level: 'High' },
    { period: 'Weekday Evening Rush (5:00-8:00 PM)', surge_multiplier: '1.8x', demand_level: 'Very High' },
    { period: 'Friday Afternoon (1:00-3:00 PM)', surge_multiplier: '1.5x', demand_level: 'High' },
    { period: 'Late Night Weekend (11 PM-2 AM)', surge_multiplier: '2.1x', demand_level: 'Critical' },
  ],
  revenue_impact: 'Surge pricing contributed $182K in additional revenue during January, representing 14% of total Cairo revenue. However, rider cancellation rates increased by 22% when surge exceeded 1.8x.',
  recommendations: [
    { title: 'Cap Late Night Surge', description: 'Limit weekend late-night surge to 1.8x maximum to reduce cancellations', impact: 'High', priority: 'Urgent' },
    { title: 'Pre-position Drivers', description: 'Use predictive models to pre-position 200 extra drivers before evening rush', impact: 'Medium', priority: 'High' },
    { title: 'Loyalty Surge Shield', description: 'Offer top-tier loyalty members a 0.3x surge discount during moderate periods', impact: 'Medium', priority: 'Medium' },
  ],
  supply_demand_analysis: 'The driver-to-rider ratio during peak evening hours is 1:4.2, well above the optimal 1:2.5. Increasing driver supply by 35% during 5-8 PM would bring surge multipliers below 1.4x and reduce wait times by an estimated 2.3 minutes.',
}

const SAMPLE_COMPLIANCE_DATA = {
  verdict: 'Needs Review',
  driver_name: 'Ahmed Hassan',
  review_summary: 'Driver Ahmed Hassan has a mostly compliant profile with one critical flag: vehicle insurance expires in 12 days. Background check passed. Driver license valid until 2026. Vehicle inspection shows minor wear items.',
  checks: [
    { check_name: 'Driver License', status: 'Pass', details: 'Valid commercial license, expires March 2026' },
    { check_name: 'Vehicle Registration', status: 'Pass', details: 'Registered in driver name, current year tags' },
    { check_name: 'Insurance Certificate', status: 'Warning', details: 'Expires in 12 days - renewal required' },
    { check_name: 'Background Check', status: 'Pass', details: 'No criminal record, clean driving history' },
    { check_name: 'Vehicle Inspection', status: 'Warning', details: 'Minor brake pad wear noted, replacement recommended within 30 days' },
    { check_name: 'Profile Photo', status: 'Pass', details: 'Photo matches ID, clear and recent' },
  ],
  flags: ['Insurance expiring within 14 days', 'Vehicle brake pads showing wear'],
  expiry_alerts: ['Insurance Certificate expires on February 8, 2025', 'Next vehicle inspection due March 15, 2025'],
  recommended_actions: [
    'Send urgent insurance renewal reminder to driver',
    'Schedule brake pad replacement at partner garage',
    'Set follow-up review for February 10 to confirm insurance renewal',
    'Temporarily restrict to short-distance trips until brake pads replaced',
  ],
  reasoning: 'While the driver meets most compliance requirements, the impending insurance expiry poses a regulatory risk. Operating without valid insurance would result in immediate deactivation and potential legal liability. The brake pad wear is not critical but should be addressed proactively for rider safety.',
}

const SAMPLE_REPORT_DATA = {
  report_title: 'HiyatCab Weekly Operations Report',
  report_type: 'Weekly Ops',
  period: 'January 20-26, 2025',
  executive_summary: [
    'Total trips increased 12% WoW to 87,150 across all cities',
    'Revenue reached $338K, surpassing weekly target by 8%',
    'Average driver rating improved to 4.72 from 4.68',
    'Cairo and Riyadh account for 68% of total trip volume',
  ],
  key_metrics: [
    { metric: 'Total Trips', value: '87,150', change: '+12%' },
    { metric: 'Gross Revenue', value: '$338K', change: '+8%' },
    { metric: 'Active Drivers', value: '3,450', change: '+3%' },
    { metric: 'Avg Trip Distance', value: '8.2 km', change: '-2%' },
    { metric: 'Customer Satisfaction', value: '4.72/5', change: '+0.04' },
    { metric: 'Cancellation Rate', value: '6.8%', change: '-1.2%' },
  ],
  sections: [
    { title: 'City Performance', content: 'Cairo leads with 35,200 trips (+15% WoW), followed by Riyadh at 24,100 trips (+9%). Dubai maintained steady volume at 15,800 trips. Alexandria showed the strongest growth at +22% WoW, driven by new driver onboarding campaign.' },
    { title: 'Driver Operations', content: 'Driver utilization averaged 78% during peak hours. New driver onboarding: 145 drivers completed verification this week. Driver churn rate held steady at 1.2% weekly. Top performing drivers averaged 42 trips per day.' },
    { title: 'Financial Highlights', content: 'Average revenue per trip: $3.88 (+$0.12 WoW). Surge revenue contributed 14% of total. Payment processing costs reduced by 3% after gateway optimization. Promotional spend was $12.4K, generating estimated $45K in incremental revenue.' },
  ],
  recommendations: [
    'Expand Alexandria fleet by 20% to capitalize on growth momentum',
    'Implement driver fuel subsidy program to reduce churn in Dubai',
    'Launch corporate accounts pilot in Riyadh financial district',
    'Optimize surge algorithm to reduce >2x multiplier frequency by 30%',
  ],
  email_status: 'Sent successfully to ops-team@hiyatcab.com',
}

// ============================================================================
// Markdown Renderer
// ============================================================================

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
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

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
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
            <li key={i} className="ml-4 list-disc text-sm text-muted-foreground">
              {formatInline(line.slice(2))}
            </li>
          )
        if (/^\d+\.\s/.test(line))
          return (
            <li key={i} className="ml-4 list-decimal text-sm text-muted-foreground">
              {formatInline(line.replace(/^\d+\.\s/, ''))}
            </li>
          )
        if (!line.trim()) return <div key={i} className="h-1" />
        return (
          <p key={i} className="text-sm text-muted-foreground">
            {formatInline(line)}
          </p>
        )
      })}
    </div>
  )
}

// ============================================================================
// Agent Call Helper
// ============================================================================

async function callAndParse(message: string, agentId: string) {
  const result: AIAgentResponse = await callAIAgent(message, agentId)
  if (!result.success) {
    return { success: false, data: null, error: result.error || 'Agent call failed' }
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
  return { success: true, data: parsed, error: null }
}

// ============================================================================
// ErrorBoundary
// ============================================================================

class ErrorBoundary extends React.Component<
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
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-accent text-accent-foreground rounded-md text-sm"
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

function SkeletonBlock() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-5 bg-muted rounded w-3/4" />
      <div className="h-4 bg-muted rounded w-full" />
      <div className="h-4 bg-muted rounded w-5/6" />
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="h-20 bg-muted rounded" />
        <div className="h-20 bg-muted rounded" />
      </div>
      <div className="h-4 bg-muted rounded w-2/3 mt-4" />
      <div className="h-4 bg-muted rounded w-full" />
      <div className="h-4 bg-muted rounded w-4/5" />
    </div>
  )
}

// ============================================================================
// StatusMessage
// ============================================================================

function StatusMessage({ type, message, onDismiss }: { type: 'success' | 'error' | 'warning' | 'info'; message: string; onDismiss?: () => void }) {
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
    <div className={`flex items-start gap-2 p-3 rounded-md border text-sm ${styles[type]}`}>
      {icons[type]}
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="opacity-60 hover:opacity-100">
          <HiOutlineXMark className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

// ============================================================================
// Severity / Status Badges
// ============================================================================

function SeverityBadge({ severity }: { severity: string }) {
  const s = (severity || '').toLowerCase()
  let cls = 'bg-muted text-muted-foreground'
  if (s === 'critical') cls = 'bg-red-900/40 text-red-300 border border-red-700/40'
  else if (s === 'high' || s === 'urgent') cls = 'bg-orange-900/40 text-orange-300 border border-orange-700/40'
  else if (s === 'medium') cls = 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/40'
  else if (s === 'low') cls = 'bg-green-900/40 text-green-300 border border-green-700/40'
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>{severity}</span>
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const v = (verdict || '').toLowerCase()
  let cls = 'bg-muted text-muted-foreground'
  if (v.includes('approved') || v.includes('pass')) cls = 'bg-green-900/40 text-green-300 border border-green-700/40'
  else if (v.includes('rejected') || v.includes('fail')) cls = 'bg-red-900/40 text-red-300 border border-red-700/40'
  else if (v.includes('review') || v.includes('warning') || v.includes('needs')) cls = 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/40'
  return <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${cls}`}>{verdict}</span>
}

function CheckStatusIcon({ status }: { status: string }) {
  const s = (status || '').toLowerCase()
  if (s === 'pass' || s === 'passed' || s === 'valid') return <HiOutlineCheck className="w-5 h-5 text-green-400" />
  if (s === 'fail' || s === 'failed' || s === 'invalid') return <HiOutlineXMark className="w-5 h-5 text-red-400" />
  return <HiOutlineExclamationTriangle className="w-5 h-5 text-yellow-400" />
}

function ImpactBadge({ impact }: { impact: string }) {
  const i = (impact || '').toLowerCase()
  let cls = 'bg-muted text-muted-foreground'
  if (i === 'high') cls = 'bg-red-900/40 text-red-300'
  else if (i === 'medium') cls = 'bg-yellow-900/40 text-yellow-300'
  else if (i === 'low') cls = 'bg-green-900/40 text-green-300'
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{impact}</span>
}

function TrendIcon({ trend }: { trend: string }) {
  const t = (trend || '').toLowerCase()
  if (t.includes('up') || t.includes('+')) return <HiOutlineArrowTrendingUp className="w-4 h-4 text-green-400" />
  if (t.includes('down') || t.includes('-')) return <HiOutlineArrowTrendingDown className="w-4 h-4 text-red-400" />
  return <HiOutlineMinus className="w-4 h-4 text-muted-foreground" />
}

// ============================================================================
// Dashboard Tab
// ============================================================================

function DashboardTab({ sampleMode, activeAgentId, setActiveAgentId }: { sampleMode: boolean; activeAgentId: string | null; setActiveAgentId: (id: string | null) => void }) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const [queryHistory, setQueryHistory] = useState<string[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [copyFn, copied] = useCopyToClipboard()

  const displayData = sampleMode && !data ? SAMPLE_DASHBOARD_DATA : data

  const handleAsk = useCallback(async () => {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setActiveAgentId(OPS_AGENT_ID)
    try {
      const res = await callAndParse(query, OPS_AGENT_ID)
      if (res.success) {
        setData(res.data)
        setQueryHistory(prev => [query, ...prev.slice(0, 9)])
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
    { label: 'Trips Today', value: '12,450', icon: <HiOutlineTruck className="w-6 h-6" />, trend: 'up 12%' },
    { label: 'Active Drivers', value: '3,210', icon: <HiOutlineUserGroup className="w-6 h-6" />, trend: 'up 5%' },
    { label: 'Avg ETA', value: '4.2 min', icon: <HiOutlineClock className="w-6 h-6" />, trend: 'down 8%' },
    { label: 'Revenue', value: '$48.2K', icon: <HiOutlineCurrencyDollar className="w-6 h-6" />, trend: 'up 15%' },
  ]

  const metrics = Array.isArray(displayData?.key_metrics) ? displayData.key_metrics : []
  const recommendations = Array.isArray(displayData?.recommendations) ? displayData.recommendations : []

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground">{card.icon}</span>
              <div className="flex items-center gap-1 text-xs">
                <TrendIcon trend={card.trend} />
                <span className="text-muted-foreground">{card.trend}</span>
              </div>
            </div>
            <p className="text-2xl font-semibold font-mono text-foreground">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="font-serif text-lg font-semibold tracking-wide text-foreground mb-3">Operations Intelligence</h3>
        <div className="flex gap-3">
          <textarea
            className="flex-1 bg-secondary border border-border rounded-md p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-accent"
            rows={3}
            placeholder="Ask any operational question... (e.g., What are today's key performance trends?)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAsk() } }}
          />
          <div className="flex flex-col gap-2">
            <button
              onClick={handleAsk}
              disabled={loading || !query.trim()}
              className="px-5 py-2 bg-accent text-accent-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-2"
            >
              {loading ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiSearch className="w-4 h-4" />}
              Ask
            </button>
            {queryHistory.length > 0 && (
              <button
                onClick={() => setHistoryOpen(!historyOpen)}
                className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-xs hover:opacity-90 transition-opacity flex items-center gap-1"
              >
                <HiOutlineClock className="w-3 h-3" />
                History
                {historyOpen ? <HiOutlineChevronUp className="w-3 h-3" /> : <HiOutlineChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>
        {historyOpen && queryHistory.length > 0 && (
          <div className="mt-3 bg-secondary rounded-md p-3 space-y-1">
            <p className="text-xs font-medium text-muted-foreground mb-2">Recent Queries</p>
            {queryHistory.map((q, i) => (
              <button
                key={i}
                onClick={() => setQuery(q)}
                className="block w-full text-left text-sm text-foreground hover:text-accent px-2 py-1 rounded hover:bg-muted transition-colors truncate"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <StatusMessage type="error" message={error} onDismiss={() => setError(null)} />}

      {loading && (
        <div className="bg-card border border-border rounded-lg p-6">
          <SkeletonBlock />
        </div>
      )}

      {!loading && displayData && (
        <div className="space-y-4">
          {displayData.answer && (
            <div className="bg-card border border-accent/30 rounded-lg p-5">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-serif text-sm font-semibold tracking-wide text-accent">Answer</h4>
                <button
                  onClick={() => copyFn(typeof displayData === 'object' ? JSON.stringify(displayData, null, 2) : String(displayData))}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? <HiOutlineCheck className="w-4 h-4 text-green-400" /> : <HiOutlineClipboard className="w-4 h-4" />}
                </button>
              </div>
              {renderMarkdown(displayData.answer)}
            </div>
          )}

          {metrics.length > 0 && (
            <div>
              <h4 className="font-serif text-sm font-semibold tracking-wide text-foreground mb-3">Key Metrics</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {metrics.map((m: any, i: number) => (
                  <div key={i} className="bg-card border border-border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">{m?.metric_name ?? 'Metric'}</span>
                      <TrendIcon trend={m?.trend ?? ''} />
                    </div>
                    <p className="text-lg font-semibold font-mono text-foreground">{m?.value ?? '-'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{m?.trend ?? ''}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {displayData.analysis && (
            <div className="bg-card border border-border rounded-lg p-5">
              <h4 className="font-serif text-sm font-semibold tracking-wide text-foreground mb-2">Analysis</h4>
              {renderMarkdown(displayData.analysis)}
            </div>
          )}

          {recommendations.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-5">
              <h4 className="font-serif text-sm font-semibold tracking-wide text-foreground mb-3">Recommendations</h4>
              <ol className="space-y-2">
                {recommendations.map((rec: string, i: number) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-medium">{i + 1}</span>
                    <span className="text-sm text-muted-foreground">{rec}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {displayData.data_source_note && (
            <p className="text-xs text-muted-foreground italic px-1">{displayData.data_source_note}</p>
          )}
        </div>
      )}

      {!loading && !displayData && (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <HiOutlineChartBar className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-muted-foreground text-sm">Ask an operational question above to get started</p>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Support Tab
// ============================================================================

function SupportTab({ sampleMode, activeAgentId, setActiveAgentId }: { sampleMode: boolean; activeAgentId: string | null; setActiveAgentId: (id: string | null) => void }) {
  const [form, setForm] = useState({ description: '', userType: '', issueHint: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const [draftedResponse, setDraftedResponse] = useState('')
  const [copyFn, copied] = useCopyToClipboard()

  const displayData = sampleMode && !data ? SAMPLE_SUPPORT_DATA : data

  useEffect(() => {
    if (displayData?.drafted_response && !draftedResponse) {
      setDraftedResponse(displayData.drafted_response)
    }
  }, [displayData, draftedResponse])

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
        setDraftedResponse(res.data?.drafted_response || '')
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

  const actions = Array.isArray(displayData?.internal_actions) ? displayData.internal_actions : []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="font-serif text-lg font-semibold tracking-wide text-foreground mb-4">Submit Support Ticket</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Issue Description *</label>
              <textarea
                className="w-full bg-secondary border border-border rounded-md p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-accent"
                rows={6}
                placeholder="Describe the issue in detail..."
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">User Type</label>
                <select
                  className="w-full bg-secondary border border-border rounded-md p-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                  value={form.userType}
                  onChange={(e) => setForm(prev => ({ ...prev, userType: e.target.value }))}
                >
                  <option value="">Select...</option>
                  <option value="Rider">Rider</option>
                  <option value="Driver">Driver</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Issue Type Hint</label>
                <select
                  className="w-full bg-secondary border border-border rounded-md p-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                  value={form.issueHint}
                  onChange={(e) => setForm(prev => ({ ...prev, issueHint: e.target.value }))}
                >
                  <option value="">Select...</option>
                  <option value="Payment">Payment</option>
                  <option value="Trip Quality">Trip Quality</option>
                  <option value="Driver Behavior">Driver Behavior</option>
                  <option value="Safety">Safety</option>
                  <option value="App Technical">App Technical</option>
                  <option value="Account">Account</option>
                </select>
              </div>
            </div>
            <button
              onClick={handleTriage}
              disabled={loading || !form.description.trim()}
              className="w-full px-4 py-2.5 bg-accent text-accent-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {loading ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiSend className="w-4 h-4" />}
              Triage & Draft Response
            </button>
          </div>
        </div>
        {error && <StatusMessage type="error" message={error} onDismiss={() => setError(null)} />}
      </div>

      <div className="space-y-4">
        {loading && (
          <div className="bg-card border border-border rounded-lg p-6">
            <SkeletonBlock />
          </div>
        )}

        {!loading && displayData && (
          <div className="bg-card border border-border rounded-lg p-5 space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              {displayData.category && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/20 text-accent border border-accent/30">{displayData.category}</span>
              )}
              {displayData.severity && <SeverityBadge severity={displayData.severity} />}
              {displayData.priority_score != null && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">Priority: {displayData.priority_score}/10</span>
              )}
              {displayData.estimated_resolution_time && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                  <HiOutlineClock className="w-3 h-3" /> {displayData.estimated_resolution_time}
                </span>
              )}
            </div>

            {displayData.summary && (
              <div>
                <h4 className="font-serif text-sm font-semibold tracking-wide text-foreground mb-1">Summary</h4>
                {renderMarkdown(displayData.summary)}
              </div>
            )}

            {displayData.root_cause && (
              <div>
                <h4 className="font-serif text-sm font-semibold tracking-wide text-foreground mb-1">Root Cause</h4>
                {renderMarkdown(displayData.root_cause)}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-serif text-sm font-semibold tracking-wide text-foreground">Drafted Response</h4>
                <button
                  onClick={() => copyFn(draftedResponse || displayData?.drafted_response || '')}
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-xs"
                >
                  {copied ? <HiOutlineCheck className="w-3.5 h-3.5 text-green-400" /> : <FiCopy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <textarea
                className="w-full bg-secondary border border-border rounded-md p-3 text-sm text-foreground resize-y min-h-[120px] focus:outline-none focus:ring-1 focus:ring-accent"
                rows={6}
                value={sampleMode && !data ? displayData?.drafted_response || '' : draftedResponse}
                onChange={(e) => setDraftedResponse(e.target.value)}
              />
            </div>

            {actions.length > 0 && (
              <div>
                <h4 className="font-serif text-sm font-semibold tracking-wide text-foreground mb-2">Internal Actions</h4>
                <div className="space-y-1.5">
                  {actions.map((action: string, i: number) => (
                    <label key={i} className="flex items-start gap-2 text-sm text-muted-foreground cursor-pointer group">
                      <input type="checkbox" className="mt-0.5 accent-accent" />
                      <span className="group-hover:text-foreground transition-colors">{action}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => copyFn(draftedResponse || displayData?.drafted_response || '')}
                className="px-3 py-1.5 bg-accent text-accent-foreground rounded-md text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5"
              >
                <FiCopy className="w-3 h-3" /> Copy Response
              </button>
              <button
                onClick={handleTriage}
                disabled={loading || !form.description.trim()}
                className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5 disabled:opacity-40"
              >
                <FiRefreshCw className="w-3 h-3" /> Regenerate
              </button>
            </div>
          </div>
        )}

        {!loading && !displayData && (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <HiOutlineChatBubbleLeftRight className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground text-sm">Submit a support ticket to see triage results</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Pricing Tab
// ============================================================================

function PricingTab({ sampleMode, activeAgentId, setActiveAgentId }: { sampleMode: boolean; activeAgentId: string | null; setActiveAgentId: (id: string | null) => void }) {
  const [form, setForm] = useState({ city: 'Cairo', zone: '', startDate: '', endDate: '', rideType: 'Standard' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const [copyFn, copied] = useCopyToClipboard()

  const displayData = sampleMode && !data ? SAMPLE_PRICING_DATA : data

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
  const peakPeriods = Array.isArray(displayData?.peak_periods) ? displayData.peak_periods : []
  const recommendations = Array.isArray(displayData?.recommendations) ? displayData.recommendations : []

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="font-serif text-lg font-semibold tracking-wide text-foreground mb-4">Surge Pricing Analysis</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-36">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">City</label>
            <select
              className="w-full bg-secondary border border-border rounded-md p-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              value={form.city}
              onChange={(e) => setForm(prev => ({ ...prev, city: e.target.value }))}
            >
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="w-32">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Zone</label>
            <input
              type="text"
              className="w-full bg-secondary border border-border rounded-md p-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="e.g., Downtown"
              value={form.zone}
              onChange={(e) => setForm(prev => ({ ...prev, zone: e.target.value }))}
            />
          </div>
          <div className="w-36">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Start Date</label>
            <input
              type="date"
              className="w-full bg-secondary border border-border rounded-md p-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              value={form.startDate}
              onChange={(e) => setForm(prev => ({ ...prev, startDate: e.target.value }))}
            />
          </div>
          <div className="w-36">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">End Date</label>
            <input
              type="date"
              className="w-full bg-secondary border border-border rounded-md p-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              value={form.endDate}
              onChange={(e) => setForm(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Ride Type</label>
            <div className="flex gap-1">
              {rideTypes.map(rt => (
                <button
                  key={rt}
                  onClick={() => setForm(prev => ({ ...prev, rideType: rt }))}
                  className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${form.rideType === rt ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground hover:bg-muted'}`}
                >
                  {rt}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="px-5 py-2 bg-accent text-accent-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-2"
          >
            {loading ? <FiLoader className="w-4 h-4 animate-spin" /> : <HiOutlineBolt className="w-4 h-4" />}
            Analyze Pricing
          </button>
        </div>
      </div>

      {error && <StatusMessage type="error" message={error} onDismiss={() => setError(null)} />}

      {loading && (
        <div className="bg-card border border-border rounded-lg p-6">
          <SkeletonBlock />
        </div>
      )}

      {!loading && displayData && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-serif text-sm font-semibold tracking-wide text-foreground">Surge Summary</h4>
                {displayData.city && <p className="text-xs text-muted-foreground mt-0.5">{displayData.city} -- {displayData.analysis_period || 'Current period'}</p>}
              </div>
              <button
                onClick={() => copyFn(typeof displayData === 'object' ? JSON.stringify(displayData, null, 2) : String(displayData))}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {copied ? <HiOutlineCheck className="w-4 h-4 text-green-400" /> : <HiOutlineClipboard className="w-4 h-4" />}
              </button>
            </div>
            {renderMarkdown(displayData.surge_summary || '')}
          </div>

          {peakPeriods.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-5">
              <h4 className="font-serif text-sm font-semibold tracking-wide text-foreground mb-3">Peak Periods</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Period</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Surge Multiplier</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Demand Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {peakPeriods.map((pp: any, i: number) => (
                      <tr key={i} className="border-b border-border/50 last:border-0">
                        <td className="py-2.5 px-3 text-foreground">{pp?.period ?? '-'}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-accent">{pp?.surge_multiplier ?? '-'}</td>
                        <td className="py-2.5 px-3"><SeverityBadge severity={pp?.demand_level ?? ''} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {displayData.revenue_impact && (
            <div className="bg-card border border-border rounded-lg p-5">
              <h4 className="font-serif text-sm font-semibold tracking-wide text-foreground mb-2">Revenue Impact</h4>
              {renderMarkdown(displayData.revenue_impact)}
            </div>
          )}

          {displayData.supply_demand_analysis && (
            <div className="bg-card border border-border rounded-lg p-5">
              <h4 className="font-serif text-sm font-semibold tracking-wide text-foreground mb-2">Supply-Demand Analysis</h4>
              {renderMarkdown(displayData.supply_demand_analysis)}
            </div>
          )}

          {recommendations.length > 0 && (
            <div>
              <h4 className="font-serif text-sm font-semibold tracking-wide text-foreground mb-3">Recommendations</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {recommendations.map((rec: any, i: number) => (
                  <div key={i} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-semibold text-foreground">{rec?.title ?? `Recommendation ${i + 1}`}</h5>
                      {rec?.priority && <SeverityBadge severity={rec.priority} />}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{rec?.description ?? ''}</p>
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

      {!loading && !displayData && (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <HiOutlineCurrencyDollar className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-muted-foreground text-sm">Configure filters above and analyze surge pricing</p>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Compliance Tab
// ============================================================================

function ComplianceTab({ sampleMode, activeAgentId, setActiveAgentId }: { sampleMode: boolean; activeAgentId: string | null; setActiveAgentId: (id: string | null) => void }) {
  const [form, setForm] = useState({
    driverName: '', docType: '', expiryDate: '', vehicleAge: '', vehicleModel: '', region: 'Cairo', notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const [copyFn, copied] = useCopyToClipboard()

  const displayData = sampleMode && !data ? SAMPLE_COMPLIANCE_DATA : data

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

  const docTypes = ['Driver License', 'Vehicle Registration', 'Insurance Certificate', 'Background Check', 'Vehicle Inspection', 'Profile Photo']
  const regions = ['Cairo', 'Riyadh', 'Dubai', 'Jeddah', 'Alexandria', 'Doha']
  const checks = Array.isArray(displayData?.checks) ? displayData.checks : []
  const flags = Array.isArray(displayData?.flags) ? displayData.flags : []
  const expiryAlerts = Array.isArray(displayData?.expiry_alerts) ? displayData.expiry_alerts : []
  const recActions = Array.isArray(displayData?.recommended_actions) ? displayData.recommended_actions : []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="font-serif text-lg font-semibold tracking-wide text-foreground mb-4">Compliance Review</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Driver Name *</label>
            <input
              type="text"
              className="w-full bg-secondary border border-border rounded-md p-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Enter driver name"
              value={form.driverName}
              onChange={(e) => setForm(prev => ({ ...prev, driverName: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Document Type</label>
              <select
                className="w-full bg-secondary border border-border rounded-md p-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                value={form.docType}
                onChange={(e) => setForm(prev => ({ ...prev, docType: e.target.value }))}
              >
                <option value="">All Documents</option>
                {docTypes.map(dt => <option key={dt} value={dt}>{dt}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Expiry Date</label>
              <input
                type="date"
                className="w-full bg-secondary border border-border rounded-md p-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                value={form.expiryDate}
                onChange={(e) => setForm(prev => ({ ...prev, expiryDate: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Vehicle Age (years)</label>
              <input
                type="number"
                className="w-full bg-secondary border border-border rounded-md p-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder="e.g., 3"
                value={form.vehicleAge}
                onChange={(e) => setForm(prev => ({ ...prev, vehicleAge: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Vehicle Model</label>
              <input
                type="text"
                className="w-full bg-secondary border border-border rounded-md p-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder="e.g., Toyota Camry 2022"
                value={form.vehicleModel}
                onChange={(e) => setForm(prev => ({ ...prev, vehicleModel: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Region</label>
            <select
              className="w-full bg-secondary border border-border rounded-md p-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              value={form.region}
              onChange={(e) => setForm(prev => ({ ...prev, region: e.target.value }))}
            >
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Additional Notes</label>
            <textarea
              className="w-full bg-secondary border border-border rounded-md p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-accent"
              rows={3}
              placeholder="Any additional information..."
              value={form.notes}
              onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>
          <button
            onClick={handleReview}
            disabled={loading || !form.driverName.trim()}
            className="w-full px-4 py-2.5 bg-accent text-accent-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading ? <FiLoader className="w-4 h-4 animate-spin" /> : <HiOutlineShieldCheck className="w-4 h-4" />}
            Review Documents
          </button>
        </div>
        {error && <div className="mt-4"><StatusMessage type="error" message={error} onDismiss={() => setError(null)} /></div>}
      </div>

      <div className="space-y-4">
        {loading && (
          <div className="bg-card border border-border rounded-lg p-6">
            <SkeletonBlock />
          </div>
        )}

        {!loading && displayData && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-serif text-base font-semibold tracking-wide text-foreground">{displayData.driver_name || 'Driver'}</h4>
                  {displayData.verdict && <VerdictBadge verdict={displayData.verdict} />}
                </div>
                <button
                  onClick={() => copyFn(typeof displayData === 'object' ? JSON.stringify(displayData, null, 2) : String(displayData))}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied ? <HiOutlineCheck className="w-4 h-4 text-green-400" /> : <HiOutlineClipboard className="w-4 h-4" />}
                </button>
              </div>
              {displayData.review_summary && (
                <div className="mt-3">{renderMarkdown(displayData.review_summary)}</div>
              )}
            </div>

            {checks.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-5">
                <h4 className="font-serif text-sm font-semibold tracking-wide text-foreground mb-3">Validation Checklist</h4>
                <div className="space-y-2">
                  {checks.map((check: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-2.5 rounded-md bg-secondary/50">
                      <CheckStatusIcon status={check?.status ?? ''} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{check?.check_name ?? 'Check'}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${(check?.status || '').toLowerCase() === 'pass' ? 'bg-green-900/30 text-green-300' : (check?.status || '').toLowerCase() === 'fail' ? 'bg-red-900/30 text-red-300' : 'bg-yellow-900/30 text-yellow-300'}`}>{check?.status ?? ''}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{check?.details ?? ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {flags.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-5">
                <h4 className="font-serif text-sm font-semibold tracking-wide text-foreground mb-2">Flags</h4>
                <div className="space-y-1.5">
                  {flags.map((flag: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <HiOutlineExclamationTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{flag}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {expiryAlerts.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-5">
                <h4 className="font-serif text-sm font-semibold tracking-wide text-foreground mb-2">Expiry Alerts</h4>
                <div className="space-y-1.5">
                  {expiryAlerts.map((alert: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <HiOutlineClock className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{alert}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recActions.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-5">
                <h4 className="font-serif text-sm font-semibold tracking-wide text-foreground mb-2">Recommended Actions</h4>
                <ol className="space-y-1.5">
                  {recActions.map((action: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-medium">{i + 1}</span>
                      <span className="text-muted-foreground">{action}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {displayData.reasoning && (
              <div className="bg-card border border-border rounded-lg p-5">
                <h4 className="font-serif text-sm font-semibold tracking-wide text-foreground mb-2">Detailed Reasoning</h4>
                {renderMarkdown(displayData.reasoning)}
              </div>
            )}
          </div>
        )}

        {!loading && !displayData && (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <HiOutlineShieldCheck className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground text-sm">Enter driver details and submit for compliance review</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Reports Tab
// ============================================================================

function ReportsTab({ sampleMode, activeAgentId, setActiveAgentId }: { sampleMode: boolean; activeAgentId: string | null; setActiveAgentId: (id: string | null) => void }) {
  const [form, setForm] = useState({ reportType: 'Weekly Ops', startDate: '', endDate: '', recipientEmail: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const [copyFn, copied] = useCopyToClipboard()
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; text: string } | null>(null)

  // Schedule state
  const [scheduleId, setScheduleId] = useState(INITIAL_SCHEDULE_ID)
  const [scheduleData, setScheduleData] = useState<Schedule | null>(null)
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [scheduleEmail, setScheduleEmail] = useState('')
  const [scheduleEmailSaved, setScheduleEmailSaved] = useState(false)
  const [logs, setLogs] = useState<ExecutionLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)

  const displayData = sampleMode && !data ? SAMPLE_REPORT_DATA : data
  const reportTypes = ['Weekly Ops', 'Financial Summary', 'City Performance', 'Driver Metrics']

  // Load schedule on mount
  const loadSchedules = useCallback(async () => {
    setScheduleLoading(true)
    try {
      const result = await listSchedules({ agentId: REPORT_AGENT_ID })
      if (result.success && Array.isArray(result.schedules) && result.schedules.length > 0) {
        const found = result.schedules.find(s => s.id === scheduleId) || result.schedules[0]
        setScheduleData(found)
        setScheduleId(found.id)
        // Extract email from message if present
        const msgMatch = (found.message || '').match(/email\s+to:\s*(\S+)/i)
        if (msgMatch) {
          setScheduleEmail(msgMatch[1])
          setScheduleEmailSaved(true)
        }
      }
    } catch (err) {
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
    setLogsLoading(true)
    try {
      const result = await getScheduleLogs(scheduleId, { limit: 5 })
      if (result.success) {
        setLogs(Array.isArray(result.executions) ? result.executions : [])
      }
    } catch (err) {
      // silent
    } finally {
      setLogsLoading(false)
    }
  }, [scheduleId])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  const handleGenerate = useCallback(async () => {
    setLoading(true)
    setError(null)
    setActiveAgentId(REPORT_AGENT_ID)
    try {
      let message = `Generate a ${form.reportType} report`
      if (form.startDate && form.endDate) message += ` for the period ${form.startDate} to ${form.endDate}`
      const res = await callAndParse(message, REPORT_AGENT_ID)
      if (res.success) {
        setData(res.data)
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
    setActiveAgentId(REPORT_AGENT_ID)
    try {
      let message = `Generate a ${form.reportType} report`
      if (form.startDate && form.endDate) message += ` for the period ${form.startDate} to ${form.endDate}`
      message += `. Send via email to: ${form.recipientEmail}`
      const res = await callAndParse(message, REPORT_AGENT_ID)
      if (res.success) {
        setData(res.data)
        setStatusMsg({ type: 'success', text: `Report sent to ${form.recipientEmail}` })
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
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Failed to update schedule' })
    } finally {
      setScheduleLoading(false)
    }
  }, [scheduleId, scheduleEmail, loadSchedules])

  const handleToggleSchedule = useCallback(async () => {
    if (!scheduleData) return
    if (!scheduleData.is_active && !scheduleEmailSaved) {
      setStatusMsg({ type: 'warning', text: 'Please enter and save a recipient email before activating the schedule' })
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
        setStatusMsg({ type: 'success', text: 'Schedule activated' })
      }
      await loadSchedules()
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Failed to toggle schedule' })
    } finally {
      setScheduleLoading(false)
    }
  }, [scheduleData, scheduleId, scheduleEmailSaved, loadSchedules])

  const execSummary = Array.isArray(displayData?.executive_summary) ? displayData.executive_summary : []
  const keyMetrics = Array.isArray(displayData?.key_metrics) ? displayData.key_metrics : []
  const sections = Array.isArray(displayData?.sections) ? displayData.sections : []
  const recommendations = Array.isArray(displayData?.recommendations) ? displayData.recommendations : []

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="font-serif text-lg font-semibold tracking-wide text-foreground mb-4">Generate Report</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Report Type</label>
            <div className="flex gap-1 flex-wrap">
              {reportTypes.map(rt => (
                <button
                  key={rt}
                  onClick={() => setForm(prev => ({ ...prev, reportType: rt }))}
                  className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${form.reportType === rt ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground hover:bg-muted'}`}
                >
                  {rt}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-36">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Start Date</label>
              <input
                type="date"
                className="w-full bg-secondary border border-border rounded-md p-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                value={form.startDate}
                onChange={(e) => setForm(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div className="w-36">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">End Date</label>
              <input
                type="date"
                className="w-full bg-secondary border border-border rounded-md p-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                value={form.endDate}
                onChange={(e) => setForm(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Recipient Email</label>
              <input
                type="email"
                className="w-full bg-secondary border border-border rounded-md p-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder="ops-team@hiyatcab.com"
                value={form.recipientEmail}
                onChange={(e) => setForm(prev => ({ ...prev, recipientEmail: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-5 py-2.5 bg-accent text-accent-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-2"
            >
              {loading ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiFileText className="w-4 h-4" />}
              Generate Report
            </button>
            <button
              onClick={handleEmailReport}
              disabled={loading || !form.recipientEmail.trim()}
              className="px-5 py-2.5 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-2 border border-border"
            >
              {loading ? <FiLoader className="w-4 h-4 animate-spin" /> : <HiOutlineEnvelope className="w-4 h-4" />}
              Email Report
            </button>
          </div>
        </div>
      </div>

      {error && <StatusMessage type="error" message={error} onDismiss={() => setError(null)} />}
      {statusMsg && <StatusMessage type={statusMsg.type} message={statusMsg.text} onDismiss={() => setStatusMsg(null)} />}

      {loading && (
        <div className="bg-card border border-border rounded-lg p-6">
          <SkeletonBlock />
        </div>
      )}

      {!loading && displayData && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-serif text-base font-semibold tracking-wide text-foreground">{displayData.report_title || 'Report'}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{displayData.report_type || ''} -- {displayData.period || ''}</p>
              </div>
              <button
                onClick={() => copyFn(typeof displayData === 'object' ? JSON.stringify(displayData, null, 2) : String(displayData))}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {copied ? <HiOutlineCheck className="w-4 h-4 text-green-400" /> : <HiOutlineClipboard className="w-4 h-4" />}
              </button>
            </div>

            {displayData.email_status && (
              <div className="mb-3 flex items-center gap-2 text-xs">
                <HiOutlineEnvelope className="w-3.5 h-3.5 text-green-400" />
                <span className="text-green-300">{displayData.email_status}</span>
              </div>
            )}

            {execSummary.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-semibold text-foreground mb-2">Executive Summary</h5>
                <ul className="space-y-1.5">
                  {execSummary.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <FiChevronRight className="w-3 h-3 text-accent flex-shrink-0 mt-1" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {keyMetrics.length > 0 && (
            <div>
              <h5 className="font-serif text-sm font-semibold tracking-wide text-foreground mb-3">Key Metrics</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {keyMetrics.map((m: any, i: number) => (
                  <div key={i} className="bg-card border border-border rounded-lg p-3">
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

          {sections.length > 0 && (
            <div className="space-y-3">
              {sections.map((sec: any, i: number) => (
                <div key={i} className="bg-card border border-border rounded-lg p-5">
                  <h5 className="font-serif text-sm font-semibold tracking-wide text-foreground mb-2">{sec?.title ?? `Section ${i + 1}`}</h5>
                  {renderMarkdown(sec?.content ?? '')}
                </div>
              ))}
            </div>
          )}

          {recommendations.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-5">
              <h5 className="font-serif text-sm font-semibold tracking-wide text-foreground mb-3">Recommendations</h5>
              <ol className="space-y-2">
                {recommendations.map((rec: string, i: number) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-medium">{i + 1}</span>
                    <span className="text-sm text-muted-foreground">{rec}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {!loading && !displayData && (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <HiOutlineDocumentText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-muted-foreground text-sm">Configure report parameters above and generate</p>
        </div>
      )}

      {/* Schedule Management Section */}
      <div className="bg-card border border-accent/20 rounded-lg p-5">
        <div className="flex items-center gap-3 mb-4">
          <FiCalendar className="w-5 h-5 text-accent" />
          <h3 className="font-serif text-lg font-semibold tracking-wide text-foreground">Automated Weekly Report</h3>
        </div>

        {scheduleLoading && !scheduleData && (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-8 bg-muted rounded w-1/3" />
          </div>
        )}

        {scheduleData && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-secondary rounded-md p-3">
                <p className="text-xs text-muted-foreground mb-0.5">Schedule</p>
                <p className="text-sm font-medium text-foreground">{cronToHuman(scheduleData.cron_expression)}</p>
              </div>
              <div className="bg-secondary rounded-md p-3">
                <p className="text-xs text-muted-foreground mb-0.5">Timezone</p>
                <p className="text-sm font-medium text-foreground">{scheduleData.timezone || 'UTC'}</p>
              </div>
              <div className="bg-secondary rounded-md p-3">
                <p className="text-xs text-muted-foreground mb-0.5">Status</p>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${scheduleData.is_active ? 'bg-green-400' : 'bg-gray-500'}`} />
                  <p className="text-sm font-medium text-foreground">{scheduleData.is_active ? 'Active' : 'Paused'}</p>
                </div>
              </div>
            </div>

            {scheduleData.next_run_time && (
              <p className="text-xs text-muted-foreground">Next run: {new Date(scheduleData.next_run_time).toLocaleString()}</p>
            )}

            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Recipient Email for Scheduled Reports</label>
                <input
                  type="email"
                  className="w-full bg-secondary border border-border rounded-md p-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="ops-team@hiyatcab.com"
                  value={scheduleEmail}
                  onChange={(e) => { setScheduleEmail(e.target.value); setScheduleEmailSaved(false) }}
                />
              </div>
              <button
                onClick={handleSaveScheduleEmail}
                disabled={scheduleLoading || !scheduleEmail.trim()}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-1.5 border border-border"
              >
                {scheduleLoading ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <HiOutlineCheck className="w-3.5 h-3.5" />}
                Save
              </button>
            </div>

            {scheduleEmailSaved && (
              <p className="text-xs text-green-400 flex items-center gap-1"><FiCheckCircle className="w-3 h-3" /> Email saved to schedule</p>
            )}

            <button
              onClick={handleToggleSchedule}
              disabled={scheduleLoading}
              className={`w-full px-4 py-2.5 rounded-md text-sm font-medium transition-opacity disabled:opacity-40 flex items-center justify-center gap-2 ${scheduleData.is_active ? 'bg-secondary text-secondary-foreground border border-border hover:opacity-90' : 'bg-accent text-accent-foreground hover:opacity-90'}`}
            >
              {scheduleLoading ? (
                <FiLoader className="w-4 h-4 animate-spin" />
              ) : scheduleData.is_active ? (
                <><HiOutlinePause className="w-4 h-4" /> Pause Schedule</>
              ) : (
                <><HiOutlinePlay className="w-4 h-4" /> Activate Schedule</>
              )}
            </button>

            {logs.length > 0 && (
              <div className="mt-4">
                <h5 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Recent Executions</h5>
                <div className="space-y-1.5">
                  {logs.map((log, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs bg-secondary/50 rounded-md p-2">
                      {log.success ? <FiCheckCircle className="w-3 h-3 text-green-400" /> : <FiXCircle className="w-3 h-3 text-red-400" />}
                      <span className="text-muted-foreground">{new Date(log.executed_at).toLocaleString()}</span>
                      <span className={`ml-auto ${log.success ? 'text-green-400' : 'text-red-400'}`}>{log.success ? 'Success' : 'Failed'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!scheduleData && !scheduleLoading && (
          <p className="text-sm text-muted-foreground">Schedule data not available. Schedule ID: {scheduleId}</p>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Agent Status Panel
// ============================================================================

function AgentStatusPanel({ activeAgentId }: { activeAgentId: string | null }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-2">
          <HiOutlineBolt className="w-4 h-4 text-accent" />
          AI Agents
          {activeAgentId && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
        </span>
        {expanded ? <HiOutlineChevronUp className="w-4 h-4" /> : <HiOutlineChevronDown className="w-4 h-4" />}
      </button>
      {expanded && (
        <div className="border-t border-border px-4 py-3 space-y-2">
          {AGENTS_INFO.map(agent => (
            <div key={agent.id} className="flex items-center gap-2.5">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeAgentId === agent.id ? 'bg-green-400 animate-pulse' : 'bg-muted-foreground/40'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{agent.name}</p>
                <p className="text-xs text-muted-foreground truncate">{agent.purpose}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Main Page
// ============================================================================

export default function Page() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard')
  const [sampleMode, setSampleMode] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const tabTitles: Record<TabKey, string> = {
    dashboard: 'Operations Dashboard',
    support: 'Support Triage',
    pricing: 'Pricing & Surge Analysis',
    compliance: 'Compliance Review',
    reports: 'Reports & Scheduling',
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground flex">
        {/* Sidebar */}
        <aside className={`fixed left-0 top-0 h-full bg-[hsl(20,28%,6%)] border-r border-[hsl(20,18%,12%)] flex flex-col z-30 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
          {/* Brand */}
          <div className="p-5 border-b border-[hsl(20,18%,12%)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center">
                <HiOutlineTruck className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h1 className="font-serif text-base font-semibold tracking-wide text-foreground">HiyatCab Ops</h1>
                <p className="text-xs text-muted-foreground">Operations Platform</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-3 space-y-1">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${activeTab === tab.key ? 'bg-[hsl(20,18%,12%)] text-accent' : 'text-[hsl(35,20%,90%)] hover:bg-[hsl(20,18%,12%)]/50 hover:text-foreground'}`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Bottom */}
          <div className="p-3 border-t border-[hsl(20,18%,12%)]">
            <AgentStatusPanel activeAgentId={activeAgentId} />
          </div>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          {/* Top Bar */}
          <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b border-border">
            <div className="flex items-center justify-between px-6 py-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </button>
                <h2 className="font-serif text-lg font-semibold tracking-wide text-foreground">{tabTitles[activeTab]}</h2>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <span className="text-xs text-muted-foreground">Sample Data</span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={sampleMode}
                      onChange={() => setSampleMode(!sampleMode)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-secondary rounded-full peer-checked:bg-accent transition-colors" />
                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-foreground rounded-full transition-transform peer-checked:translate-x-4" />
                  </div>
                </label>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'dashboard' && (
              <DashboardTab sampleMode={sampleMode} activeAgentId={activeAgentId} setActiveAgentId={setActiveAgentId} />
            )}
            {activeTab === 'support' && (
              <SupportTab sampleMode={sampleMode} activeAgentId={activeAgentId} setActiveAgentId={setActiveAgentId} />
            )}
            {activeTab === 'pricing' && (
              <PricingTab sampleMode={sampleMode} activeAgentId={activeAgentId} setActiveAgentId={setActiveAgentId} />
            )}
            {activeTab === 'compliance' && (
              <ComplianceTab sampleMode={sampleMode} activeAgentId={activeAgentId} setActiveAgentId={setActiveAgentId} />
            )}
            {activeTab === 'reports' && (
              <ReportsTab sampleMode={sampleMode} activeAgentId={activeAgentId} setActiveAgentId={setActiveAgentId} />
            )}
          </div>
        </main>
      </div>
    </ErrorBoundary>
  )
}
