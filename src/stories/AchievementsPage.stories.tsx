import type { Meta, StoryObj } from '@storybook/react';
import AchievementsPage from '../pages/AchievementsPage';
import { AppDecorator } from './decorators';

const meta: Meta<typeof AchievementsPage> = {
  title: 'Pages/AchievementsPage',
  component: AchievementsPage,
  decorators: [AppDecorator],
};

export default meta;
type Story = StoryObj<typeof AchievementsPage>;

export const Default: Story = {};
