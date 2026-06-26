import type { Meta, StoryObj } from '@storybook/react';
import SquadPage from '../pages/MorePage';
import { AppDecorator } from './decorators';

const meta: Meta<typeof SquadPage> = {
  title: 'Pages/SquadPage',
  component: SquadPage,
  decorators: [AppDecorator],
};

export default meta;
type Story = StoryObj<typeof SquadPage>;

export const Default: Story = {};
