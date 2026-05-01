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
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface PaymentFailedEmailProps {
  businessName?: string;
}

export const PaymentFailedEmail = ({
  businessName = 'Tu negocio',
}: PaymentFailedEmailProps) => (
  <Html>
    <Head />
    <Preview>Problema con el pago de {businessName} — acción requerida</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src={LOGO_URL} alt="Tablero de Control" width={160} style={logoImg} />
        </Section>

        <Heading style={h1}>Problema con el pago</Heading>

        <Text style={text}>
          No pudimos procesar el pago de la suscripción de <strong>{businessName}</strong>.
          Esto puede deberse a fondos insuficientes, tarjeta vencida u otro problema con tu método de pago.
        </Text>

        <Text style={text}>
          Para evitar la suspensión de tu cuenta, actualizá tu método de pago o realizá el pago manualmente
          desde el panel de facturación.
        </Text>

        <Section style={buttonContainer}>
          <Button style={button} href={`${APP_URL}/dashboard/billing`}>
            Ir a facturación
          </Button>
        </Section>

        <Hr style={hr} />

        <Text style={footer}>
          TecnoFusión IT - Soluciones inteligentes de gestión.<br />
          Este es un correo automático, por favor no respondas directamente.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default PaymentFailedEmail;

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
  color: '#dc2626',
  fontSize: '24px',
  fontWeight: 'bold',
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
  backgroundColor: '#dc2626',
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
