import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

describe('Card Component', () => {
  it('renders card with all subcomponents', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>Card Content</CardContent>
        <CardFooter>Card Footer</CardFooter>
      </Card>
    );

    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Description')).toBeInTheDocument();
    expect(screen.getByText('Card Content')).toBeInTheDocument();
    expect(screen.getByText('Card Footer')).toBeInTheDocument();
  });

  it('renders as a div element', () => {
    render(<Card data-testid="card">Test</Card>);
    expect(screen.getByTestId('card').tagName).toBe('DIV');
  });

  it('applies custom className', () => {
    render(<Card className="custom-class">Test</Card>);
    expect(screen.getByText('Test')).toHaveClass('custom-class');
  });

  it('CardTitle renders as h3', () => {
    render(<CardTitle>Heading</CardTitle>);
    const heading = screen.getByText('Heading');
    expect(heading.tagName).toBe('H3');
  });

  it('CardDescription renders as paragraph', () => {
    render(<CardDescription>Description text</CardDescription>);
    expect(screen.getByText('Description text')).toBeInTheDocument();
  });
});
