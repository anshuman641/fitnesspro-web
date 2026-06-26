import type { Meta, StoryObj } from '@storybook/react';
import WorkoutsPage from '../pages/WorkoutsPage';
import { AppDecorator } from './decorators';

const meta: Meta<typeof WorkoutsPage> = {
  title: 'Pages/WorkoutsPage',
  component: WorkoutsPage,
  decorators: [AppDecorator],
  parameters: {
    router: { initialEntries: ['/workouts'] },
  },
};

export default meta;
type Story = StoryObj<typeof WorkoutsPage>;

export const Default: Story = {};
