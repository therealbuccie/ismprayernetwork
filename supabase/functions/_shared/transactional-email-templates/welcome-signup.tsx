/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface WelcomeSignupProps {
  fullName?: string
  ministryName?: string
  siteUrl?: string
}

const SITE_URL = 'https://www.ismprayernetwork.org'
const logoUrl =
  'https://ryitxoymayasdlabojsx.supabase.co/storage/v1/object/public/book-covers/logo.png'

const WelcomeSignupEmail = ({
  fullName,
  ministryName,
  siteUrl = SITE_URL,
}: WelcomeSignupProps) => {
  const greeting = fullName && fullName.trim() ? fullName.trim() : 'Esteemed Minister'

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Welcome to the ISM Prayer Network — your account is ready</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img src={logoUrl} alt="ISM Prayer Network" width="140" height="auto" style={logo} />

          <Heading style={h1}>Welcome to the ISM Prayer Network</Heading>

          <Text style={text}>Dear {greeting},</Text>

          <Text style={text}>
            Thank you for joining the <strong>ISM Prayer Network</strong>
            {ministryName && ministryName.trim() ? <> on behalf of {ministryName.trim()}</> : null}.
            We are delighted to have you praying with ministers of the Gospel from across the world.
          </Text>

          <Section style={card}>
            <Text style={cardHeading}>Here is what you can do right away</Text>
            <Text style={listItem}>• Pray along with this week's guided prayer points</Text>
            <Text style={listItem}>• Join a live prayer group and the 24/7 ISM Prayer Room</Text>
            <Text style={listItem}>• Book your personal prayer slot and receive reminders</Text>
            <Text style={listItem}>• Read and share testimonies, and submit your prayer reports</Text>
            <Text style={listItem}>• Explore the bookstore and your personal library</Text>
          </Section>

          <Button style={button} href={`${siteUrl}/prayer-points`}>
            Start praying now
          </Button>

          <Text style={text}>
            You can sign in any time at{' '}
            <Link href={siteUrl} style={link}>
              ismprayernetwork.org
            </Link>
            . If you have a question, simply reply to this email or reach us through the contact
            page.
          </Text>

          <Hr style={hr} />

          <Text style={verse}>
            “Pray without ceasing.” — 1 Thessalonians 5:17
          </Text>

          <Text style={footer}>
            You are receiving this email because an account was created with this address on the ISM
            Prayer Network.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: WelcomeSignupEmail,
  subject: 'Welcome to the ISM Prayer Network',
  displayName: 'Welcome — new sign up',
  previewData: {
    fullName: 'Pastor Grace Adeyemi',
    ministryName: 'Light House Ministry',
    siteUrl: SITE_URL,
  },
} satisfies TemplateEntry

export default WelcomeSignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '600px' }
const logo = { margin: '0 0 24px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: 'hsl(230, 40%, 10%)',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: 'hsl(230, 10%, 45%)',
  lineHeight: '1.6',
  margin: '0 0 18px',
}
const card = {
  backgroundColor: 'hsl(230, 25%, 97%)',
  border: '1px solid hsl(230, 15%, 88%)',
  borderRadius: '12px',
  padding: '18px 20px',
  margin: '0 0 24px',
}
const cardHeading = {
  fontSize: '13px',
  fontWeight: '700' as const,
  color: 'hsl(230, 60%, 28%)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.04em',
  margin: '0 0 12px',
}
const listItem = {
  fontSize: '14px',
  color: 'hsl(230, 40%, 15%)',
  lineHeight: '1.6',
  margin: '0 0 6px',
}
const button = {
  backgroundColor: 'hsl(230, 60%, 28%)',
  color: 'hsl(40, 80%, 95%)',
  fontSize: '14px',
  fontWeight: '600' as const,
  borderRadius: '12px',
  padding: '12px 24px',
  textDecoration: 'none',
  display: 'inline-block',
  margin: '0 0 24px',
}
const link = { color: 'hsl(230, 60%, 28%)', textDecoration: 'underline' }
const hr = { borderColor: 'hsl(230, 15%, 88%)', margin: '28px 0 20px' }
const verse = {
  fontSize: '13px',
  fontStyle: 'italic' as const,
  color: 'hsl(38, 90%, 42%)',
  margin: '0 0 16px',
}
const footer = { fontSize: '12px', color: '#999999', margin: '0' }
