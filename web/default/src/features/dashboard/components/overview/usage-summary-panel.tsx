/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  DatabaseZap,
  Gauge,
  RefreshCw,
  RotateCcw,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import dayjs from '@/lib/dayjs'
import { formatNumber, formatQuota, formatTokens } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { CompactDateTimeRangePicker } from '@/features/usage-logs/components/compact-date-time-range-picker'
import { getUserUsageSummary } from '../../api'
import type { UsageSummaryDimension } from '../../types'

const MAX_USAGE_RANGE_SECONDS = 30 * 24 * 60 * 60
const QUICK_RANGES = [
  { value: '1h', label: '1 hour', amount: 1, unit: 'hour' },
  { value: '5h', label: '5 hours', amount: 5, unit: 'hour' },
  { value: '1d', label: '1 day', amount: 1, unit: 'day' },
  { value: '1w', label: '1 week', amount: 1, unit: 'week' },
  { value: '1m', label: '1 month', amount: 30, unit: 'day' },
] as const

type QuickRangeValue = (typeof QUICK_RANGES)[number]['value']

type UsageRange = {
  start: Date
  end: Date
}

function getDefaultRange(): UsageRange {
  const now = dayjs()
  return {
    start: now.subtract(30, 'day').toDate(),
    end: now.toDate(),
  }
}

function getQuickRange(value: QuickRangeValue): UsageRange {
  const quickRange = QUICK_RANGES.find((item) => item.value === value)
  const now = dayjs()
  if (!quickRange) return getDefaultRange()

  return {
    start: now.subtract(quickRange.amount, quickRange.unit).toDate(),
    end: now.toDate(),
  }
}

function getMatchingQuickRange(range: UsageRange): QuickRangeValue | null {
  const diffSeconds = dayjs(range.end).diff(dayjs(range.start), 'second')
  const toleranceSeconds = 90

  for (const item of QUICK_RANGES) {
    const expected = dayjs(range.end)
      .subtract(item.amount, item.unit)
      .diff(dayjs(range.end), 'second')
    if (Math.abs(diffSeconds + expected) <= toleranceSeconds) {
      return item.value
    }
  }

  return null
}

function getMaxRangeStart(end: Date): Date {
  return dayjs(end).subtract(30, 'day').toDate()
}

function getRangeLimitLabel(t: (key: string) => string): string {
  return t('1 month')
}

function getInitialRange(): UsageRange {
  const now = dayjs()
  return {
    start: now.subtract(30, 'day').toDate(),
    end: now.toDate(),
  }
}

function toUnixSeconds(date: Date): number {
  return Math.floor(date.getTime() / 1000)
}

function clampRange(range: { start?: Date; end?: Date }): UsageRange {
  const fallback = getDefaultRange()
  const end = range.end ?? fallback.end
  let start = range.start ?? fallback.start

  if (end.getTime() < start.getTime()) {
    start = dayjs(end).subtract(1, 'day').startOf('day').toDate()
  }

  const seconds = (end.getTime() - start.getTime()) / 1000
  if (seconds > MAX_USAGE_RANGE_SECONDS) {
    start = getMaxRangeStart(end)
  }

  return { start, end }
}

function formatRate(value: number): string {
  return Intl.NumberFormat(undefined, {
    style: 'percent',
    maximumFractionDigits: 2,
  }).format(value)
}

type UsageSummaryPanelProps = {
  isAdmin?: boolean
}

const ADMIN_DIMENSIONS: UsageSummaryDimension[] = ['user', 'token', 'model']
const USER_DIMENSIONS: UsageSummaryDimension[] = ['token', 'model']

function getDimensionLabel(t: (key: string) => string, dimension: UsageSummaryDimension) {
  if (dimension === 'token') {
    return t('By token')
  }
  if (dimension === 'model') {
    return t('By model')
  }
  return t('By user')
}

export function UsageSummaryPanel({ isAdmin = false }: UsageSummaryPanelProps) {
  const { t } = useTranslation()
  const dimensions = isAdmin ? ADMIN_DIMENSIONS : USER_DIMENSIONS
  const [range, setRange] = useState<UsageRange>(() => getInitialRange())
  const [dimension, setDimension] = useState<UsageSummaryDimension>(() =>
    isAdmin ? 'user' : 'token'
  )

  useEffect(() => {
    if (!isAdmin && dimension === 'user') {
      setDimension('token')
    }
  }, [dimension, isAdmin])

  const queryRange = useMemo(
    () => ({
      start_timestamp: toUnixSeconds(range.start),
      end_timestamp: toUnixSeconds(range.end),
      dimension,
      limit: 20,
    }),
    [dimension, range.end, range.start]
  )

  const summaryQuery = useQuery({
    queryKey: [
      'dashboard',
      'overview',
      'usage-summary',
      queryRange.start_timestamp,
      queryRange.end_timestamp,
      queryRange.dimension,
    ],
    queryFn: () => getUserUsageSummary(queryRange),
    staleTime: 60 * 1000,
  })

  const summary = summaryQuery.data?.data.total
  const rows = summaryQuery.data?.data.items ?? []
  const cacheHitPercent = Math.min(
    100,
    Math.max(0, (summary?.cache_hit_rate ?? 0) * 100)
  )
  const activeQuickRange = getMatchingQuickRange(range)

  const statItems = [
    {
      label: t('Requests'),
      value: formatNumber(summary?.request_count ?? 0),
      icon: Activity,
    },
    {
      label: t('Total tokens'),
      value: formatTokens(summary?.total_tokens ?? 0),
      icon: Sparkles,
    },
    {
      label: t('Prompt tokens'),
      value: formatTokens(summary?.prompt_tokens ?? 0),
      icon: TrendingUp,
    },
    {
      label: t('Completion tokens'),
      value: formatTokens(summary?.completion_tokens ?? 0),
      icon: Gauge,
    },
    {
      label: t('Cache read tokens'),
      value: formatTokens(summary?.cached_tokens ?? 0),
      icon: DatabaseZap,
    },
    {
      label: t('Cache write tokens'),
      value: formatTokens(summary?.cache_write_tokens ?? 0),
      icon: DatabaseZap,
    },
  ]

  return (
    <div className='bg-card overflow-hidden rounded-2xl border shadow-xs'>
      <div className='flex flex-col gap-4 p-4 sm:p-5'>
        <div className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
          <div className='flex flex-col gap-1'>
            <h3 className='text-base font-semibold'>{t('My token usage')}</h3>
            <p className='text-muted-foreground text-sm'>
              {isAdmin
                ? t('Review token consumption and cache hit rate by dimension')
                : t('Review your own token consumption and cache hit rate')}
            </p>
          </div>
          <div className='flex w-full flex-col gap-2 sm:flex-row lg:w-auto'>
            <div className='bg-muted flex h-9 rounded-md p-1'>
              {dimensions.map((item) => (
                <button
                  key={item}
                  type='button'
                  onClick={() => setDimension(item)}
                  className={`rounded px-3 text-sm font-medium whitespace-nowrap transition-colors ${
                    dimension === item
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {getDimensionLabel(t, item)}
                </button>
              ))}
            </div>
            <ToggleGroup
              type='single'
              value={activeQuickRange ?? undefined}
              onValueChange={(value) => {
                if (value) setRange(getQuickRange(value as QuickRangeValue))
              }}
              size='sm'
              variant='outline'
              className='flex-wrap'
            >
              {QUICK_RANGES.map((item) => (
                <ToggleGroupItem key={item.value} value={item.value}>
                  {t(item.label)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <CompactDateTimeRangePicker
              start={range.start}
              end={range.end}
              onChange={(nextRange) => setRange(clampRange(nextRange))}
              className='lg:w-80'
            />
            <Button
              type='button'
              variant='outline'
              onClick={() => setRange(getQuickRange('1m'))}
            >
              <RotateCcw data-icon='inline-start' />
              {t('Reset')}
            </Button>
            <Button
              type='button'
              variant='outline'
              onClick={() => summaryQuery.refetch()}
              disabled={summaryQuery.isFetching}
            >
              <RefreshCw data-icon='inline-start' />
              {t('Refresh')}
            </Button>
          </div>
        </div>

        <div className='grid gap-3 xl:grid-cols-[minmax(0,1fr)_18rem]'>
          <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
            {statItems.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.label}
                  className='bg-background/60 rounded-xl border p-3'
                >
                  <div className='text-muted-foreground flex items-center gap-2 text-xs font-medium'>
                    <Icon className='size-3.5' aria-hidden='true' />
                    <span className='truncate'>{item.label}</span>
                  </div>
                  {summaryQuery.isLoading ? (
                    <Skeleton className='mt-2 h-7 w-24' />
                  ) : (
                    <div className='mt-2 font-mono text-xl font-semibold tracking-tight tabular-nums'>
                      {item.value}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className='bg-primary/10 flex flex-col justify-between gap-4 rounded-xl border p-4'>
            <div className='flex flex-col gap-1'>
              <div className='text-muted-foreground text-xs font-medium'>
                {t('Cache hit rate')}
              </div>
              {summaryQuery.isLoading ? (
                <Skeleton className='h-8 w-24' />
              ) : (
                <div className='font-mono text-3xl font-semibold tracking-tight tabular-nums'>
                  {formatRate(summary?.cache_hit_rate ?? 0)}
                </div>
              )}
            </div>
            <Progress value={cacheHitPercent} />
            <div className='grid grid-cols-2 gap-2 text-xs'>
              <div className='bg-background/60 rounded-lg px-2.5 py-2'>
                <div className='text-muted-foreground truncate'>
                  {t('Usage cost')}
                </div>
                <div className='mt-1 font-semibold tabular-nums'>
                  {formatQuota(summary?.quota ?? 0)}
                </div>
              </div>
              <div className='bg-background/60 rounded-lg px-2.5 py-2'>
                <div className='text-muted-foreground truncate'>
                  {t('Range limit')}
                </div>
                <div className='mt-1 font-semibold tabular-nums'>
                  {getRangeLimitLabel(t)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='overflow-hidden rounded-xl border'>
          <div className='bg-muted/40 grid grid-cols-[minmax(8rem,1fr)_7rem_7rem_7rem_6rem] gap-3 px-3 py-2 text-xs font-medium text-muted-foreground max-lg:hidden'>
            <span>{getDimensionLabel(t, dimension)}</span>
            <span className='text-right'>{t('Total tokens')}</span>
            <span className='text-right'>{t('Requests')}</span>
            <span className='text-right'>{t('Usage cost')}</span>
            <span className='text-right'>{t('Cache hit rate')}</span>
          </div>
          {summaryQuery.isLoading ? (
            <div className='space-y-2 p-3'>
              <Skeleton className='h-9 w-full' />
              <Skeleton className='h-9 w-full' />
              <Skeleton className='h-9 w-full' />
            </div>
          ) : rows.length === 0 ? (
            <div className='p-6 text-center text-sm text-muted-foreground'>
              {t('No usage data in the selected range')}
            </div>
          ) : (
            <div className='divide-y'>
              {rows.map((row) => (
                <div
                  key={`${row.dimension}-${row.key}`}
                  className='grid gap-2 px-3 py-3 text-sm lg:grid-cols-[minmax(8rem,1fr)_7rem_7rem_7rem_6rem] lg:gap-3'
                >
                  <div className='min-w-0'>
                    <div className='truncate font-medium'>{row.label}</div>
                    <div className='text-muted-foreground mt-0.5 truncate text-xs'>
                      {row.key}
                    </div>
                  </div>
                  <div className='flex justify-between gap-2 lg:block lg:text-right'>
                    <span className='text-muted-foreground lg:hidden'>
                      {t('Total tokens')}
                    </span>
                    <span className='font-mono tabular-nums'>
                      {formatTokens(row.total_tokens ?? 0)}
                    </span>
                  </div>
                  <div className='flex justify-between gap-2 lg:block lg:text-right'>
                    <span className='text-muted-foreground lg:hidden'>
                      {t('Requests')}
                    </span>
                    <span className='font-mono tabular-nums'>
                      {formatNumber(row.request_count ?? 0)}
                    </span>
                  </div>
                  <div className='flex justify-between gap-2 lg:block lg:text-right'>
                    <span className='text-muted-foreground lg:hidden'>
                      {t('Usage cost')}
                    </span>
                    <span className='font-mono tabular-nums'>
                      {formatQuota(row.quota ?? 0)}
                    </span>
                  </div>
                  <div className='flex justify-between gap-2 lg:block lg:text-right'>
                    <span className='text-muted-foreground lg:hidden'>
                      {t('Cache hit rate')}
                    </span>
                    <span className='font-mono tabular-nums'>
                      {formatRate(row.cache_hit_rate ?? 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
