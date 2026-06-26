import type { Meta, StoryObj } from '@storybook/react';
import AppearancePage from '../pages/AppearancePage';
import { AppDecorator } from './decorators';

const meta: Meta<typeof AppearancePage> = {
  title: 'Pages/AppearancePage',
  component: AppearancePage,
  decorators: [AppDecorator],
};

export default meta;
type Story = StoryObj<typeof AppearancePage>;

export const Default: Story = {};
