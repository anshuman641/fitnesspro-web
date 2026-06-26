import type { Meta, StoryObj } from '@storybook/react';
import LoginPage from '../pages/LoginPage';
import { LoginDecorator } from './decorators';

const meta: Meta<typeof LoginPage> = {
  title: 'Pages/LoginPage',
  component: LoginPage,
  decorators: [LoginDecorator],
};

export default meta;
type Story = StoryObj<typeof LoginPage>;

export const Default: Story = {};
