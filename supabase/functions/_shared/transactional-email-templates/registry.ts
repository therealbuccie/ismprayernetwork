/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import { template as welcomeSignup } from './welcome-signup.tsx'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data?: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'welcome-signup': welcomeSignup,
}
