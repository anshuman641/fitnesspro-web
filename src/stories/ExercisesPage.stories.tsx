import type { Meta, StoryObj } from '@storybook/react';
import ExercisesPage from '../pages/ExercisesPage';
import { AppDecorator } from './decorators';

const meta: Meta<typeof ExercisesPage> = {
  title: 'Pages/ExercisesPage',
  component: ExercisesPage,
  decorators: [AppDecorator],
  parameters: {
    router: { initialEntries: ['/exercises'] },
  },
};

export default meta;
type Story = StoryObj<typeof ExercisesPage>;

export const Default: Story = {};
