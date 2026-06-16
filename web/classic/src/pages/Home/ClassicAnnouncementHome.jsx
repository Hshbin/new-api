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
import { Button, Typography } from '@douyinfe/semi-ui';
import { Link } from 'react-router-dom';

const { Text, Title } = Typography;

const InfoBlock = ({ title, children }) => (
  <section className='rounded-2xl border border-semi-color-border bg-semi-color-bg-1 p-5 shadow-sm'>
    <Title heading={5} className='!mb-3'>
      {title}
    </Title>
    <div className='space-y-1 text-base leading-7 text-semi-color-text-0'>
      {children}
    </div>
  </section>
);

const ClassicAnnouncementHome = ({ systemName }) => {
  return (
    <main className='classic-home-default w-full bg-semi-color-bg-0'>
      <div className='mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 md:px-8 md:py-14'>
        <header className='flex flex-col gap-4 border-b border-semi-color-border pb-6 md:flex-row md:items-end md:justify-between'>
          <div>
            <Text type='tertiary' className='text-sm'>
              {systemName || 'AI 模型服务平台'}
            </Text>
            <Title heading={2} className='!mb-2 !mt-1'>
              系统公告
            </Title>
            <Text className='max-w-3xl text-base leading-7 text-semi-color-text-1'>
              欢迎使用本站 AI 模型服务平台。请合理使用资源，避免高频异常请求，共同保持服务稳定。
            </Text>
          </div>
          <div className='flex gap-3'>
            <Link to='/console'>
              <Button theme='solid' type='primary'>
                进入控制台
              </Button>
            </Link>
            <Link to='/console/setting'>
              <Button>配置首页</Button>
            </Link>
          </div>
        </header>

        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
          <InfoBlock title='服务与支持'>
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

          <InfoBlock title='温馨提示'>
            <p>管理员可在系统设置中修改首页内容。</p>
            <p>感谢理解与支持，祝使用愉快。</p>
          </InfoBlock>
        </div>
      </div>
    </main>
  );
};

export default ClassicAnnouncementHome;
