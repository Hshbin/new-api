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
import { memo, useMemo } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DateTimePicker } from '@/components/datetime-picker'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { safeJsonParse } from '../utils/json-parser'

type GroupRatioRestoreRule = {
  group: string
  ratio: number
  restore_at: number
}

type GroupRatioRestoreEditorProps = {
  enabled: boolean
  rules: string
  groupRatio: string
  onEnabledChange: (enabled: boolean) => void
  onRulesChange: (rules: string) => void
}

const sectionCardClassName =
  'relative shadow-sm ring-0 before:pointer-events-none before:absolute before:inset-0 before:rounded-xl before:border before:border-border/90'
const sectionHeaderClassName = 'border-b bg-muted/20'

function parseRules(rules: string): GroupRatioRestoreRule[] {
  return safeJsonParse<GroupRatioRestoreRule[]>(rules, {
    fallback: [],
    silent: true,
  }).filter(
    (rule) =>
      rule &&
      typeof rule.group === 'string' &&
      typeof rule.ratio === 'number' &&
      typeof rule.restore_at === 'number'
  )
}

function getGroupRatioMap(groupRatio: string) {
  return safeJsonParse<Record<string, number>>(groupRatio, {
    fallback: {},
    silent: true,
  })
}

function serializeRules(rules: GroupRatioRestoreRule[]) {
  return JSON.stringify(
    rules.filter((rule) => rule.group.trim() && rule.restore_at > 0),
    null,
    2
  )
}

function toDate(timestamp: number) {
  return timestamp > 0 ? new Date(timestamp * 1000) : undefined
}

function toTimestamp(date: Date | undefined) {
  return date ? Math.floor(date.getTime() / 1000) : 0
}

export const GroupRatioRestoreEditor = memo(function GroupRatioRestoreEditor({
  enabled,
  rules,
  groupRatio,
  onEnabledChange,
  onRulesChange,
}: GroupRatioRestoreEditorProps) {
  const { t } = useTranslation()
  const ratioMap = useMemo(() => getGroupRatioMap(groupRatio), [groupRatio])
  const restoreRules = useMemo(() => parseRules(rules), [rules])
  const groupOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...Object.keys(ratioMap),
          ...restoreRules.map((rule) => rule.group),
        ])
      ).filter(Boolean),
    [ratioMap, restoreRules]
  )

  const emitRules = (nextRules: GroupRatioRestoreRule[]) => {
    onRulesChange(serializeRules(nextRules))
  }

  const updateRule = (
    index: number,
    patch: Partial<GroupRatioRestoreRule>
  ) => {
    emitRules(
      restoreRules.map((rule, currentIndex) =>
        currentIndex === index ? { ...rule, ...patch } : rule
      )
    )
  }

  const addRule = () => {
    const group = groupOptions[0] ?? 'default'
    const restoreDate = new Date()
    restoreDate.setHours(restoreDate.getHours() + 1, 0, 0, 0)
    emitRules([
      ...restoreRules,
      {
        group,
        ratio: Number.isFinite(ratioMap[group]) ? ratioMap[group] : 1,
        restore_at: toTimestamp(restoreDate),
      },
    ])
  }

  const deleteRule = (index: number) => {
    emitRules(restoreRules.filter((_, currentIndex) => currentIndex !== index))
  }

  return (
    <Card className={sectionCardClassName}>
      <CardHeader className={sectionHeaderClassName}>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
          <div>
            <CardTitle>{t('Scheduled group ratio restore')}</CardTitle>
            <CardDescription>
              {t(
                'Temporarily lower a group ratio, then restore it at a selected date and time.'
              )}
            </CardDescription>
          </div>
          <Switch checked={enabled} onCheckedChange={onEnabledChange} />
        </div>
      </CardHeader>
      <CardContent>
        <div className='flex flex-col gap-3'>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <p className='text-muted-foreground text-sm'>
              {t('Rules are checked once per minute by the backend task.')}
            </p>
            <Button type='button' size='sm' onClick={addRule}>
              <Plus className='mr-2 h-4 w-4' />
              {t('Add restore rule')}
            </Button>
          </div>

          {restoreRules.length === 0 ? (
            <div className='text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm'>
              {t('No restore rules yet. Add one when you need a timed rollback.')}
            </div>
          ) : (
            <div className='flex flex-col gap-3'>
              {restoreRules.map((rule, index) => (
                <div
                  key={`${rule.group}-${rule.restore_at}-${index}`}
                  className='grid gap-3 rounded-lg border p-3 md:grid-cols-[minmax(150px,1fr)_120px_minmax(260px,1.5fr)_auto]'
                >
                  <div className='flex flex-col gap-1.5'>
                    <span className='text-sm font-medium'>{t('Group')}</span>
                    {groupOptions.length > 0 ? (
                      <Select
                        value={rule.group}
                        onValueChange={(group) =>
                          updateRule(index, {
                            group,
                            ratio: Number.isFinite(ratioMap[group])
                              ? ratioMap[group]
                              : rule.ratio,
                          })
                        }
                      >
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder={t('Select group')} />
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false}>
                          <SelectGroup>
                            {groupOptions.map((group) => (
                              <SelectItem key={group} value={group}>
                                {group}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={rule.group}
                        onChange={(event) =>
                          updateRule(index, { group: event.target.value })
                        }
                        placeholder='default'
                      />
                    )}
                  </div>

                  <div className='flex flex-col gap-1.5'>
                    <span className='text-sm font-medium'>
                      {t('Restore ratio')}
                    </span>
                    <Input
                      type='number'
                      min={0}
                      step={0.001}
                      value={String(rule.ratio)}
                      onChange={(event) =>
                        updateRule(index, {
                          ratio: Number(event.target.value),
                        })
                      }
                    />
                  </div>

                  <div className='flex flex-col gap-1.5'>
                    <span className='text-sm font-medium'>
                      {t('Restore time')}
                    </span>
                    <DateTimePicker
                      value={toDate(rule.restore_at)}
                      onChange={(date) =>
                        updateRule(index, { restore_at: toTimestamp(date) })
                      }
                      placeholder={t('Select restore time')}
                      showSeconds
                    />
                  </div>

                  <div className='flex items-end justify-end'>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      onClick={() => deleteRule(index)}
                      aria-label={t('Delete')}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
})
