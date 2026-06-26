import type { Meta, StoryObj } from '@storybook/react';
import AddExercisePage from '../pages/AddExercisePage';
import { AppDecorator } from './decorators';

const meta: Meta<typeof AddExercisePage> = {
  title: 'Pages/AddExercisePage',
  component: AddExercisePage,
  decorators: [AppDecorator],
  parameters: {
    router: { initialEntries: ['/exercises/new'] },
  },
};

export default meta;
type Story = StoryObj<typeof AddExercisePage>;

export const Default: Story = {};
