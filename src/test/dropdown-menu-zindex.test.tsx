import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

/**
 * Regression test for the task-detail-modal dropdown bug.
 *
 * The project's Dialog uses custom z-indexes (overlay z-[300], content z-[310]).
 * If DropdownMenuContent keeps the shadcn default z-50, menus opened inside a
 * Dialog render BEHIND the overlay: invisible to the user and clicks land on
 * the overlay, which Radix treats as an outside-click and closes the menu
 * without selecting. DropdownMenuContent must stay above z-[310].
 */
describe('DropdownMenuContent z-index', () => {
  it('renders above Dialog layers (z-[320])', () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const content = document.querySelector('[data-radix-menu-content]');
    expect(content).not.toBeNull();
    expect(content!.className).toContain('z-[320]');
    expect(content!.className).not.toContain('z-50');
  });
});
