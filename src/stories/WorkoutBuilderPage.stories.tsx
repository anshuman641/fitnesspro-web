import type { Meta, StoryObj } from '@storybook/react';
import WorkoutBuilderPage from '../pages/WorkoutBuilderPage';
import { AppDecorator } from './decorators';

const meta: Meta<typeof WorkoutBuilderPage> = {
  title: 'Pages/WorkoutBuilderPage',
  component: WorkoutBuilderPage,
  decorators: [AppDecorator],
  parameters: {
    router: { initialEntries: ['/workouts/new'] },
  },
};

export default meta;
type Story = StoryObj<typeof WorkoutBuilderPage>;

export const Default: Story = {};
