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

interface TeamInviteEmailProps {
  invitedByUsername?: string;
  invitedByEmail?: string;
  teamName?: string;
  inviteLink?: string;
  resetLink?: string;
}

const LOGO_URL = 'https://res.cloudinary.com/dhhjn1fo8/image/upload/v1777644183/tablero_control/logo.png';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const TeamInviteEmail = ({
  invitedByUsername = 'Un administrador',
  invitedByEmail = 'admin@ejemplo.com',
  teamName = 'Nuestro Equipo',
  inviteLink = `${APP_URL}/login`,
  resetLink,
}: TeamInviteEmailProps) => (
  <Html>
    <Head />
    <Preview>Te han invitado a unirte a {teamName} en Tablero de Control</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoContainer}>
          <Img src={LOGO_URL} alt="Tablero de Control" width={160} style={logoImg} />
        </Section>
        <Heading style={h1}>¡Únete al equipo!</Heading>
        <Text style={text}>
          Hola,
        </Text>
        <Text style={text}>
          <strong>{invitedByUsername}</strong> ({invitedByEmail}) te ha invitado a formar parte del equipo de <strong>{teamName}</strong> en la plataforma Tablero de Control.
        </Text>
        {resetLink ? (
          <>
            <Text style={text}>
              Para acceder, primero establecé una contraseña haciendo clic en el siguiente botón:
            </Text>
            <Section style={btnContainer}>
              <Button style={button} href={resetLink}>
                Establecer contraseña
              </Button>
            </Section>
            <Text style={text}>
              También podés iniciar sesión con tu cuenta de Google desde{' '}
              <a href={inviteLink} style={{ color: '#0066cc', textDecoration: 'underline' }}>
                la página de inicio de sesión
              </a>.
            </Text>
          </>
        ) : (
          <Section style={btnContainer}>
            <Button style={button} href={inviteLink}>
              Aceptar Invitación
            </Button>
          </Section>
        )}
        <Text style={text}>
          Si no esperabas esta invitación, puedes ignorar este correo.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          Tablero de Control — El centro de mando para tu negocio.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default TeamInviteEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const logoContainer = {
  padding: '32px 48px',
  textAlign: 'center' as const,
};

const logoImg = {
  margin: '0 auto',
  display: 'block' as const,
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  padding: '0 48px',
  textAlign: 'center' as const,
  margin: '30px 0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 48px',
};

const btnContainer = {
  textAlign: 'center' as const,
  padding: '20px 0',
};

const button = {
  backgroundColor: '#000',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  padding: '0 48px',
  textAlign: 'center' as const,
};
