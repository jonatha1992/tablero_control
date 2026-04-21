import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface ResetPasswordEmailProps {
  resetLink: string;
}

export const ResetPasswordEmail = ({
  resetLink = 'https://tablerocontrol.com/auth/reset',
}: ResetPasswordEmailProps) => (
  <Html>
    <Head />
    <Preview>Recuperación de contraseña - Tablero de Control</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={logo}>TC</Heading>
        </Section>
        
        <Heading style={h1}>Recupera tu acceso</Heading>
        
        <Text style={text}>
          Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>Tablero de Control</strong>. 
          Si no realizaste esta solicitud, puedes ignorar este correo de forma segura.
        </Text>

        <Section style={buttonContainer}>
          <Button style={button} href={resetLink}>
            Restablecer Contraseña
          </Button>
        </Section>

        <Text style={text}>
          Este enlace expirará en una hora por motivos de seguridad.
        </Text>

        <Hr style={hr} />

        <Text style={footer}>
          TecnoFusión IT - Seguridad y Gestión.<br />
          Si tienes problemas con el botón, copia y pega este enlace en tu navegador:<br />
          <span style={link}>{resetLink}</span>
        </Text>
      </Container>
    </Body>
  </Html>
);

export default ResetPasswordEmail;

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

const logo = {
  margin: '0',
  color: '#3b82f6',
  fontSize: '32px',
  fontWeight: 'bold',
  letterSpacing: '-1px',
};

const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: '600',
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
  backgroundColor: '#e11d48', // Color de advertencia/seguridad
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
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

const link = {
  color: '#2563eb',
  wordBreak: 'break-all' as const,
};
