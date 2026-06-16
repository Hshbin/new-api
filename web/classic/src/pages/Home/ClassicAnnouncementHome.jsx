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

import React from 'react';
import { Typography } from '@douyinfe/semi-ui';

const { Text, Title } = Typography;

const InfoBlock = ({ title, children, accent = false }) => (
  <section
    className={`relative overflow-hidden rounded-3xl border border-semi-color-border bg-semi-color-bg-1 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
      accent ? 'ring-1 ring-blue-200/50' : ''
    }`}
  >
    <div className='absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl' />
    <Title heading={5} className='relative !mb-3'>
      {title}
    </Title>
    <div className='relative space-y-1 text-base leading-7 text-semi-color-text-0'>
      {children}
    </div>
  </section>
);

const ClassicAnnouncementHome = ({ systemName }) => {
  return (
    <main className='classic-home-default w-full overflow-hidden bg-semi-color-bg-0'>
      <div className='pointer-events-none absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl' />
      <div className='relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 md:px-8 md:py-14'>
        <header className='rounded-[2rem] border border-semi-color-border bg-semi-color-bg-1/90 p-6 shadow-sm md:p-8'>
          <div className='flex flex-col gap-4'>
            <Text type='tertiary' className='text-sm'>
              {systemName || 'AI 模型服务平台'}
            </Text>
            <Title heading={2} className='!mb-2 !mt-1'>
              欢迎使用
            </Title>
            <Text className='max-w-3xl text-base leading-7 text-semi-color-text-1'>
              请合理使用资源，避免高频异常请求，共同保持服务稳定。
            </Text>
          </div>
        </header>

        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
          <InfoBlock title='服务与支持' accent>
            <p>售后 QQ：2582328031</p>
            <p>交流 QQ 群：936663227</p>
            <p>服务时间：9:00 - 22:00</p>
          </InfoBlock>

          <InfoBlock title='模型支持'>
            <p>
              当前仅支持 <strong>gpt-5.5</strong>，使用{' '}
              <strong>gpt-pro</strong> 满血号池。
            </p>
          </InfoBlock>

          <InfoBlock title='计费说明'>
            <p>
              核心汇率：<strong>0.25 元 = 1 万</strong>
            </p>
            <p>
              充值额度：<strong>1 : 1</strong>
            </p>
            <p>
              使用倍率：<strong>0.25x</strong>
            </p>
            <p>
              服务说明：<strong>满血不虚标</strong>
            </p>
          </InfoBlock>

          <InfoBlock title='温馨提示' accent>
            <p>请妥善保管账号与密钥，避免泄露造成额度损失。</p>
            <p>如遇异常消耗或服务问题，请及时联系售后支持。</p>
          </InfoBlock>
        </div>
      </div>
    </main>
  );
};

export default ClassicAnnouncementHome;
