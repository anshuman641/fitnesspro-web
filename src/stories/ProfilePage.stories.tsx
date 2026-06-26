import type { Meta, StoryObj } from '@storybook/react';
import ProfilePage from '../pages/ProfilePage';
import { AppDecorator } from './decorators';

const meta: Meta<typeof ProfilePage> = {
  title: 'Pages/ProfilePage',
  component: ProfilePage,
  decorators: [AppDecorator],
};

export default meta;
type Story = StoryObj<typeof ProfilePage>;

export const Default: Story = {};
