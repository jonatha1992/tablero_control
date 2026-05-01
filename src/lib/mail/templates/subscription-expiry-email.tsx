import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

const LOGO_URL = 'https://res.cloudinary.com/dhhjn1fo8/image/upload/v1777644183/tablero_control/logo.png';

interface SubscriptionExpiryEmailProps {
  businessName: string;
  planName: string;
  expiryDate: string;
  renewUrl: string;
  daysLeft: number;
}

export const SubscriptionExpiryEmail = ({
  businessName = 'Tu negocio',
  planName = 'Pro',
  expiryDate = '',
  renewUrl = 'https://tablerocontrol.com/dashboard/billing',
  daysLeft = 7,
}: SubscriptionExpiryEmailProps) => (
  <Html>
    <Head />
    <Preview>Tu suscripción vence en {String(daysLeft)} días — renovar ahora</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src={LOGO_URL} alt="Tablero de Control" width={160} style={logoImg} />
        </Section>

        <Heading style={h1}>Tu suscripción está por vencer</Heading>

        <Text style={text}>
          Hola, el plan <strong>{planName}</strong> de <strong>{businessName}</strong> vence el{' '}
          <strong>{expiryDate}</strong> ({String(daysLeft)} {daysLeft === 1 ? 'día' : 'días'} restante{daysLeft === 1 ? '' : 's'}).
        </Text>

        <Text style={text}>
          Para continuar usando Tablero de Control sin interrupciones, renová tu suscripción antes de esa fecha.
        </Text>

        <Section style={buttonContainer}>
          <Button style={button} href={renewUrl}>
            Renovar suscripción
          </Button>
        </Section>

        <Text style={text}>
          Si ya realizaste el pago, podés ignorar este mensaje.
        </Text>

        <Hr style={hr} />

        <Text style={footer}>
          TecnoFusión IT - Soluciones inteligentes de gestión.<br />
          Este es un correo automático, por favor no respondas directamente.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default SubscriptionExpiryEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
};

const header = {
  padding: '32px',
  textAlign: 'center' as const,
};

const logoImg = {
  margin: '0 auto',
  display: 'block' as const,
};

const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'normal',
  textAlign: 'center' as const,
  margin: '30px 0',
};

const text = {
  color: '#4b5563',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
  padding: '0 32px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '20px 0',
  padding: '0 32px',
};

const footer = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
  padding: '0 32px',
};
