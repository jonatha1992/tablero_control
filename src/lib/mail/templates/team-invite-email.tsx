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
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ? process.env.NEXT_PUBLIC_APP_URL : 'http://localhost:3000';

export const TeamInviteEmail = ({
  invitedByUsername = 'Un administrador',
  invitedByEmail = 'admin@ejemplo.com',
  teamName = 'Nuestro Equipo',
  inviteLink = `${baseUrl}/login`,
}: TeamInviteEmailProps) => (
  <Html>
    <Head />
    <Preview>Te han invitado a unirte a {teamName} en Tablero de Control</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoContainer}>
            <div style={logo}>TC</div>
        </Section>
        <Heading style={h1}>¡Únete al equipo!</Heading>
        <Text style={text}>
          Hola,
        </Text>
        <Text style={text}>
          <strong>{invitedByUsername}</strong> ({invitedByEmail}) te ha invitado a formar parte del equipo de <strong>{teamName}</strong> en la plataforma Tablero de Control.
        </Text>
        <Section style={btnContainer}>
          <Button style={button} href={inviteLink}>
            Aceptar Invitación
          </Button>
        </Section>
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
  padding: '0 48px',
  display: 'flex',
  justifyContent: 'center',
};

const logo = {
    backgroundColor: '#000',
    color: '#fff',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '24px',
    fontWeight: 'bold',
    textAlign: 'center' as const,
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
