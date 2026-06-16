/*
Copyright (C) 2025 QuantumNous

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

import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Progress, Skeleton, Typography } from '@douyinfe/semi-ui';
import { API, renderQuota, showError } from '../../helpers';

const { Text, Title } = Typography;

const ADMIN_DIMENSIONS = [
  { value: 'user', label: '按用户' },
  { value: 'token', label: '按令牌' },
  { value: 'model', label: '按模型' },
];

const USER_DIMENSIONS = [
  { value: 'token', label: '按令牌' },
  { value: 'model', label: '按模型' },
];

const QUICK_RANGES = [
  { value: '1h', label: '1 小时', milliseconds: 60 * 60 * 1000 },
  { value: '5h', label: '5 小时', milliseconds: 5 * 60 * 60 * 1000 },
  { value: '1d', label: '1 天', milliseconds: 24 * 60 * 60 * 1000 },
  { value: '1w', label: '1 周', milliseconds: 7 * 24 * 60 * 60 * 1000 },
  { value: '1m', label: '1 个月', milliseconds: 30 * 24 * 60 * 60 * 1000 },
];

const pad = (value) => String(value).padStart(2, '0');

const toDateTimeLocal = (date) => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const getQuickRange = (value) => {
  const quickRange =
    QUICK_RANGES.find((item) => item.value === value) ||
    QUICK_RANGES[QUICK_RANGES.length - 1];
  const end = new Date();
  const start = new Date(end.getTime() - quickRange.milliseconds);
  return {
    startTime: toDateTimeLocal(start),
    endTime: toDateTimeLocal(end),
  };
};

const getActiveQuickRange = (startTime, endTime) => {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return '';
  const diff = end - start;
  const tolerance = 90 * 1000;
  const matched = QUICK_RANGES.find(
    (item) => Math.abs(diff - item.milliseconds) <= tolerance,
  );
  return matched?.value || '';
};

const toTimestamp = (value) => {
  if (!value) return 0;
  const timestamp = Math.floor(new Date(value).getTime() / 1000);
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const formatToken = (value) => {
  const num = Number(value || 0);
  if (num >= 100000000) {
    return `${(num / 100000000).toFixed(2)} 亿`;
  }
  if (num >= 10000) {
    return `${(num / 10000).toFixed(2)} 万`;
  }
  return num.toLocaleString();
};

const StatItem = ({ label, value, loading }) => (
  <div className='rounded-xl border border-semi-color-border bg-semi-color-fill-0 px-4 py-3'>
    <Text type='tertiary' size='small'>
      {label}
    </Text>
    <div className='mt-1 text-xl font-semibold text-semi-color-text-0'>
      <Skeleton loading={loading} active paragraph={false}>
        {value}
      </Skeleton>
    </div>
  </div>
);

const UserUsageSummaryPanel = ({ isAdminUser = false }) => {
  const dimensions = isAdminUser ? ADMIN_DIMENSIONS : USER_DIMENSIONS;
  const defaultRange = useMemo(() => getQuickRange('1m'), []);

  const [startTime, setStartTime] = useState(defaultRange.startTime);
  const [endTime, setEndTime] = useState(defaultRange.endTime);
  const [dimension, setDimension] = useState(isAdminUser ? 'user' : 'token');
  const [summary, setSummary] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAdminUser && dimension === 'user') {
      setDimension('token');
    }
  }, [dimension, isAdminUser]);

  const loadSummary = async () => {
    const start = toTimestamp(startTime);
    const end = toTimestamp(endTime);
    if (start && end && end < start) {
      showError('结束时间不能早于开始时间');
      return;
    }

    setLoading(true);
    try {
      const res = await API.get('/api/log/usage_summary', {
        params: {
          start_timestamp: start,
          end_timestamp: end,
          dimension,
          limit: 20,
        },
      });
      const { success, message, data } = res.data;
      if (!success) {
        showError(message);
        return;
      }
      setSummary(data?.total || data);
      setItems(data?.items || []);
    } catch (error) {
      showError(error?.message || '加载用量统计失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [dimension]);

  const cacheHitRate = Math.min(Number(summary?.cache_hit_rate || 0), 1);
  const cacheHitPercent = `${(cacheHitRate * 100).toFixed(2)}%`;
  const activeQuickRange = getActiveQuickRange(startTime, endTime);

  const applyQuickRange = (value) => {
    const nextRange = getQuickRange(value);
    setStartTime(nextRange.startTime);
    setEndTime(nextRange.endTime);
  };

  return (
    <Card className='mb-4 !rounded-2xl' bodyStyle={{ padding: 20 }}>
      <div className='mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
        <div>
          <Title heading={5} className='!mb-1'>
            我的用量统计
          </Title>
          <Text type='tertiary'>
            查看当前账号在所选时间范围内的 Token 与缓存用量
          </Text>
        </div>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
          <div className='flex rounded-lg bg-semi-color-fill-0 p-1'>
            {dimensions.map((item) => (
              <button
                key={item.value}
                type='button'
                onClick={() => setDimension(item.value)}
                className={`rounded-md px-3 py-1 text-sm ${
                  dimension === item.value
                    ? 'bg-semi-color-bg-0 font-semibold text-semi-color-text-0 shadow-sm'
                    : 'text-semi-color-text-2'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className='flex flex-wrap gap-1 rounded-lg bg-semi-color-fill-0 p-1'>
            {QUICK_RANGES.map((item) => (
              <button
                key={item.value}
                type='button'
                onClick={() => applyQuickRange(item.value)}
                className={`rounded-md px-3 py-1 text-sm ${
                  activeQuickRange === item.value
                    ? 'bg-semi-color-bg-0 font-semibold text-semi-color-text-0 shadow-sm'
                    : 'text-semi-color-text-2'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <input
            type='datetime-local'
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            className='h-9 rounded-md border border-semi-color-border bg-semi-color-bg-0 px-3 text-sm text-semi-color-text-0'
          />
          <span className='hidden text-semi-color-text-2 sm:inline'>至</span>
          <input
            type='datetime-local'
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
            className='h-9 rounded-md border border-semi-color-border bg-semi-color-bg-0 px-3 text-sm text-semi-color-text-0'
          />
          <Button type='primary' onClick={loadSummary} loading={loading}>
            查询
          </Button>
          <Button onClick={loadSummary} loading={loading}>
            刷新
          </Button>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4'>
        <StatItem
          label='总 Token'
          value={formatToken(summary?.total_tokens)}
          loading={loading && !summary}
        />
        <StatItem
          label='输入 / 输出 Token'
          value={`${formatToken(summary?.prompt_tokens)} / ${formatToken(summary?.completion_tokens)}`}
          loading={loading && !summary}
        />
        <StatItem
          label='缓存读取 / 写入 Token'
          value={`${formatToken(summary?.cached_tokens)} / ${formatToken(summary?.cache_write_tokens)}`}
          loading={loading && !summary}
        />
        <StatItem
          label='使用费用'
          value={renderQuota(summary?.quota || 0, 6)}
          loading={loading && !summary}
        />
      </div>

      <div className='mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center'>
        <div>
          <div className='mb-2 flex items-center justify-between text-sm'>
            <Text strong>缓存命中率</Text>
            <Text>{cacheHitPercent}</Text>
          </div>
          <Progress
            percent={Math.round(cacheHitRate * 100)}
            showInfo={false}
            stroke='#1677ff'
            aria-label='缓存命中率'
          />
        </div>
        <div className='rounded-xl bg-semi-color-fill-0 px-4 py-3'>
          <Text type='tertiary' size='small'>
            请求次数
          </Text>
          <div className='mt-1 text-xl font-semibold text-semi-color-text-0'>
            {Number(summary?.request_count || 0).toLocaleString()}
          </div>
        </div>
      </div>

      <div className='mt-4 overflow-hidden rounded-xl border border-semi-color-border'>
        <div className='hidden grid-cols-[minmax(0,1fr)_120px_100px_120px_100px] gap-3 bg-semi-color-fill-0 px-4 py-2 text-xs font-medium text-semi-color-text-2 lg:grid'>
          <span>{dimensions.find((item) => item.value === dimension)?.label}</span>
          <span className='text-right'>总 Token</span>
          <span className='text-right'>请求数</span>
          <span className='text-right'>使用费用</span>
          <span className='text-right'>命中率</span>
        </div>
        {loading && items.length === 0 ? (
          <div className='space-y-2 p-4'>
            <Skeleton active paragraph={{ rows: 3 }} />
          </div>
        ) : items.length === 0 ? (
          <div className='p-6 text-center text-sm text-semi-color-text-2'>
            当前时间范围暂无用量数据
          </div>
        ) : (
          <div className='divide-y divide-semi-color-border'>
            {items.map((item) => (
              <div
                key={`${item.dimension}-${item.key}`}
                className='grid gap-2 px-4 py-3 text-sm lg:grid-cols-[minmax(0,1fr)_120px_100px_120px_100px] lg:gap-3'
              >
                <div className='min-w-0'>
                  <div className='truncate font-medium text-semi-color-text-0'>
                    {item.label}
                  </div>
                  <div className='mt-0.5 truncate text-xs text-semi-color-text-2'>
                    {item.key}
                  </div>
                </div>
                <div className='flex justify-between gap-2 lg:block lg:text-right'>
                  <span className='text-semi-color-text-2 lg:hidden'>总 Token</span>
                  <span className='font-mono'>{formatToken(item.total_tokens)}</span>
                </div>
                <div className='flex justify-between gap-2 lg:block lg:text-right'>
                  <span className='text-semi-color-text-2 lg:hidden'>请求数</span>
                  <span className='font-mono'>
                    {Number(item.request_count || 0).toLocaleString()}
                  </span>
                </div>
                <div className='flex justify-between gap-2 lg:block lg:text-right'>
                  <span className='text-semi-color-text-2 lg:hidden'>使用费用</span>
                  <span className='font-mono'>{renderQuota(item.quota || 0, 6)}</span>
                </div>
                <div className='flex justify-between gap-2 lg:block lg:text-right'>
                  <span className='text-semi-color-text-2 lg:hidden'>命中率</span>
                  <span className='font-mono'>
                    {(Number(item.cache_hit_rate || 0) * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default UserUsageSummaryPanel;
