import type { Meta, StoryObj } from '@storybook/react';
import MeasurementsPage from '../pages/MeasurementsPage';
import { AppDecorator } from './decorators';

const meta: Meta<typeof MeasurementsPage> = {
  title: 'Pages/MeasurementsPage',
  component: MeasurementsPage,
  decorators: [AppDecorator],
};

export default meta;
type Story = StoryObj<typeof MeasurementsPage>;

export const Default: Story = {};
