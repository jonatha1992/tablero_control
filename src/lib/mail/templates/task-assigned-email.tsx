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

interface TaskAssignedEmailProps {
  taskTitle?: string;
  assignerName?: string;
}

export const TaskAssignedEmail = ({
  taskTitle = 'una tarea',
  assignerName = 'Un compañero',
}: TaskAssignedEmailProps) => (
  <Html>
    <Head />
    <Preview>{assignerName} te asignó una tarea: {taskTitle}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src={LOGO_URL} alt="Tablero de Control" width={160} style={logoImg} />
        </Section>

        <Heading style={h1}>Te asignaron una tarea</Heading>

        <Text style={text}>
          <strong>{assignerName}</strong> te asignó la siguiente tarea:
        </Text>

        <Section style={taskBox}>
          <Text style={taskTitle_}>📋 {taskTitle}</Text>
        </Section>

        <Section style={buttonContainer}>
          <Button style={button} href={`${APP_URL}/dashboard/tareas`}>
            Ver mis tareas
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

export default TaskAssignedEmail;

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
  padding: '0 32px',
};

const taskBox = {
  margin: '8px 32px 24px',
  backgroundColor: '#f1f5f9',
  borderRadius: '8px',
  borderLeft: '4px solid #2563eb',
  padding: '16px',
};

const taskTitle_ = {
  color: '#1e40af',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0',
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
