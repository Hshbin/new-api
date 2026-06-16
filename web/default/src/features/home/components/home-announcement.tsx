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
import { Link } from '@tanstack/react-router'
import type { ComponentType, ReactNode } from 'react'
import {
  Bell,
  Bot,
  Clock,
  Coins,
  Headphones,
  Megaphone,
  Rocket,
  Settings,
  ShieldCheck,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth-store'
import { ROLE } from '@/lib/roles'
import { useStatus } from '@/hooks/use-status'
import { Button } from '@/components/ui/button'

function AnnouncementLine(props: {
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  label: string
  children: ReactNode
}) {
  const Icon = props.icon
  return (
    <div className='flex gap-3 rounded-xl border bg-background/65 p-3 shadow-xs'>
      <span className='bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg'>
        <Icon className='size-4' aria-hidden />
      </span>
      <div className='min-w-0'>
        <div className='text-sm font-semibold'>{props.label}</div>
        <div className='text-muted-foreground mt-1 text-sm leading-relaxed'>
          {props.children}
        </div>
      </div>
    </div>
  )
}

export function HomeAnnouncement() {
  const { t } = useTranslation()
  const { status } = useStatus()
  const user = useAuthStore((state) => state.auth.user)
  const isAuthenticated = Boolean(user)
  const isAdmin = Boolean(user?.role && user.role >= ROLE.ADMIN)
  const systemName = (status?.system_name as string | undefined) || 'New API'

  return (
    <main className='bg-background overflow-x-hidden'>
      <section className='relative border-b'>
        <div
          className='absolute inset-0 bg-[linear-gradient(120deg,color-mix(in_oklch,var(--primary)_10%,transparent),transparent_38%),radial-gradient(ellipse_70%_50%_at_88%_8%,color-mix(in_oklch,var(--accent)_20%,transparent),transparent_62%)]'
          aria-hidden='true'
        />
        <div className='relative container mx-auto grid min-h-[calc(100vh-4rem)] items-center gap-8 px-4 py-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)] lg:py-16'>
          <div className='flex max-w-2xl flex-col gap-7'>
            <div className='flex items-center gap-3'>
              <img
                src='/logo.png'
                alt=''
                className='size-11 rounded-xl border bg-background object-contain p-1.5 shadow-sm'
              />
              <div className='min-w-0'>
                <div className='truncate text-sm font-medium text-muted-foreground'>
                  {systemName}
                </div>
                <h1 className='text-4xl font-semibold tracking-tight sm:text-5xl'>
                  {t('System Announcement')}
                </h1>
              </div>
            </div>

            <div className='flex flex-col gap-4'>
              <p className='text-xl leading-relaxed text-foreground sm:text-2xl'>
                {t('Welcome to this AI model service platform.')}
              </p>
              <p className='max-w-xl text-base leading-relaxed text-muted-foreground'>
                {t(
                  'Use resources reasonably, avoid high-frequency abnormal requests, and help keep service stable.'
                )}
              </p>
            </div>

            <div className='flex flex-wrap gap-2'>
              {isAuthenticated ? (
                <Button render={<Link to='/dashboard' />}>
                  <Rocket data-icon='inline-start' />
                  {t('Go to dashboard')}
                </Button>
              ) : (
                <Button render={<Link to='/sign-in' />}>
                  <Rocket data-icon='inline-start' />
                  {t('Sign in')}
                </Button>
              )}
              <Button variant='outline' render={<Link to='/pricing' />}>
                <Coins data-icon='inline-start' />
                {t('View pricing')}
              </Button>
              {isAdmin && (
                <Button
                  variant='outline'
                  render={
                    <Link
                      to='/system-settings/site/$section'
                      params={{ section: 'system-info' }}
                    />
                  }
                >
                  <Settings data-icon='inline-start' />
                  {t('Configure home page')}
                </Button>
              )}
            </div>
          </div>

          <div className='grid gap-3'>
            <AnnouncementLine
              icon={Headphones}
              label={t('Service and Support')}
            >
              <span>{t('After-sales QQ: 2582328031')}</span>
              <br />
              <span>{t('Community QQ group: 936663227')}</span>
              <br />
              <span>{t('Service hours: 9:00 - 22:00')}</span>
            </AnnouncementLine>

            <AnnouncementLine icon={Bot} label={t('Model Support')}>
              {t(
                'Currently only gpt-5.5 is supported. Use gpt-pro from the full-performance pool.'
              )}
            </AnnouncementLine>

            <AnnouncementLine icon={Coins} label={t('Billing Notes')}>
              <div className='grid gap-1 sm:grid-cols-2'>
                <span>{t('Core rate: 0.25 yuan = 10K')}</span>
                <span>{t('Recharge rate: 1:1')}</span>
                <span>{t('Usage multiplier: 0.25x')}</span>
                <span>
                  {t('Service note: full performance, no false labeling')}
                </span>
              </div>
            </AnnouncementLine>
          </div>
        </div>
      </section>

      <section className='border-b bg-muted/25'>
        <div className='container mx-auto grid gap-3 px-4 py-6 md:grid-cols-3'>
          <div className='flex items-center gap-3'>
            <Bell className='text-primary size-5 shrink-0' aria-hidden />
            <div className='text-sm font-medium'>{t('Notice')}</div>
          </div>
          <div className='flex items-center gap-3'>
            <ShieldCheck className='text-primary size-5 shrink-0' aria-hidden />
            <div className='text-sm font-medium'>
              {t('Stable service first')}
            </div>
          </div>
          <div className='flex items-center gap-3'>
            <Clock className='text-primary size-5 shrink-0' aria-hidden />
            <div className='text-sm font-medium'>
              {t('Support available every day')}
            </div>
          </div>
        </div>
      </section>

      <section className='container mx-auto px-4 py-10'>
        <div className='flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex min-w-0 items-start gap-3'>
            <span className='bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl'>
              <Megaphone className='size-5' aria-hidden />
            </span>
            <div>
              <h2 className='text-lg font-semibold'>
                {t(
                  'Thanks for your understanding and support. Enjoy using it.'
                )}
              </h2>
              <p className='mt-1 text-sm text-muted-foreground'>
                {t(
                  'Administrators can replace this default page from system settings.'
                )}
              </p>
            </div>
          </div>
          {isAdmin && (
            <Button
              render={
                <Link
                  to='/system-settings/site/$section'
                  params={{ section: 'system-info' }}
                />
              }
            >
              <Settings data-icon='inline-start' />
              {t('Edit content')}
            </Button>
          )}
        </div>
      </section>
    </main>
  )
}
