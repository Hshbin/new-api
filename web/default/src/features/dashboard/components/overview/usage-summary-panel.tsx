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
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  DatabaseZap,
  Gauge,
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
import { CompactDateTimeRangePicker } from '@/features/usage-logs/components/compact-date-time-range-picker'
import { getUserUsageSummary } from '../../api'

const MAX_USAGE_RANGE_SECONDS = 30 * 24 * 60 * 60

type UsageRange = {
  start: Date
  end: Date
}

function getDefaultRange(): UsageRange {
  const now = dayjs()
  return {
    start: now.subtract(6, 'day').startOf('day').toDate(),
    end: now.endOf('day').toDate(),
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
    start = dayjs(end).subtract(29, 'day').startOf('day').toDate()
  }

  return { start, end }
}

function formatRate(value: number): string {
  return Intl.NumberFormat(undefined, {
    style: 'percent',
    maximumFractionDigits: 2,
  }).format(value)
}

export function UsageSummaryPanel() {
  const { t } = useTranslation()
  const [range, setRange] = useState<UsageRange>(() => getDefaultRange())

  const queryRange = useMemo(
    () => ({
      start_timestamp: toUnixSeconds(range.start),
      end_timestamp: toUnixSeconds(range.end),
    }),
    [range.end, range.start]
  )

  const summaryQuery = useQuery({
    queryKey: [
      'dashboard',
      'overview',
      'usage-summary',
      queryRange.start_timestamp,
      queryRange.end_timestamp,
    ],
    queryFn: () => getUserUsageSummary(queryRange),
    staleTime: 60 * 1000,
  })

  const summary = summaryQuery.data?.data
  const cacheHitPercent = Math.min(
    100,
    Math.max(0, (summary?.cache_hit_rate ?? 0) * 100)
  )

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
              {t('Review your own token consumption and cache hit rate')}
            </p>
          </div>
          <div className='flex w-full flex-col gap-2 sm:flex-row lg:w-auto'>
            <CompactDateTimeRangePicker
              start={range.start}
              end={range.end}
              onChange={(nextRange) => setRange(clampRange(nextRange))}
              className='lg:w-80'
            />
            <Button
              type='button'
              variant='outline'
              onClick={() => setRange(getDefaultRange())}
            >
              <RotateCcw data-icon='inline-start' />
              {t('Reset')}
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
                  {t('30 days')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
