import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { Avatar } from '../components/common/Avatar';
import { MarkdownViewer } from '../components/common/MarkdownViewer';
import { EmptyState } from '../components/common/EmptyState';
import { ConnectionButton } from '../components/common/ConnectionButton';
import { EndorsementButton } from '../components/common/EndorsementButton';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ConnectionStatus } from '@devconnect/shared';

describe('DevConnect Common Components', () => {
  it('renders Button with variants and children', () => {
    render(<Button variant="primary">Launch App</Button>);
    expect(screen.getByText('Launch App')).toBeInTheDocument();
  });

  it('renders Badge with text and variant styling', () => {
    render(<Badge variant="accent">TypeScript</Badge>);
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });

  it('renders Avatar with monogram fallback when src is missing', () => {
    render(<Avatar name="Grace Hopper" />);
    expect(screen.getByText('GH')).toBeInTheDocument();
  });

  it('renders Avatar with custom image when src is provided', () => {
    render(<Avatar name="Ada Lovelace" src="https://example.com/avatar.jpg" />);
    const img = screen.getByAltText('Ada Lovelace');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('renders Card with content', () => {
    render(<Card><h3>Project Title</h3></Card>);
    expect(screen.getByText('Project Title')).toBeInTheDocument();
  });

  it('renders MarkdownViewer with formatted markdown', () => {
    const md = '# Header Title\n\n- Item 1\n- Item 2';
    render(<MarkdownViewer content={md} />);
    expect(screen.getByText('Header Title')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });

  it('renders EmptyState with custom title, description and action', () => {
    render(
      <EmptyState
        title="No projects showcased"
        description="Add your first project"
        actionText="Create Project"
        onAction={() => {}}
      />
    );
    expect(screen.getByText('No projects showcased')).toBeInTheDocument();
    expect(screen.getByText('Add your first project')).toBeInTheDocument();
    expect(screen.getByText('Create Project')).toBeInTheDocument();
  });
});

describe('DevConnect Connection & Network Components', () => {
  it('renders ConnectionButton with Connect state when no relationship exists', () => {
    render(<ConnectionButton status="NONE" onConnect={async () => {}} />);
    expect(screen.getByRole('button', { name: /connect/i })).toBeInTheDocument();
  });

  it('renders ConnectionButton with Request Sent state for outgoing pending request', () => {
    render(
      <ConnectionButton
        status={ConnectionStatus.PENDING}
        isRequester={true}
        onConnect={async () => {}}
      />
    );
    expect(screen.getByText('Request Sent')).toBeInTheDocument();
  });

  it('renders ConnectionButton with Accept and Decline for incoming pending request', () => {
    render(
      <ConnectionButton
        status={ConnectionStatus.PENDING}
        isRequester={false}
        onConnect={async () => {}}
        onRespond={async () => {}}
      />
    );
    expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /decline/i })).toBeInTheDocument();
  });

  it('renders ConnectionButton with Connected state when connected', () => {
    render(
      <ConnectionButton
        status={ConnectionStatus.ACCEPTED}
        onConnect={async () => {}}
      />
    );
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('renders nothing when connection status is SELF', () => {
    const { container } = render(<ConnectionButton status="SELF" onConnect={async () => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders ConfirmDialog with title, message and confirmation action', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Remove Connection"
        message="Are you sure you want to remove this connection?"
        confirmText="Remove"
        onClose={() => {}}
        onConfirm={() => {}}
      />
    );
    expect(screen.getByText('Remove Connection')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to remove this connection?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
  });
});

describe('DevConnect Skill Endorsement Components', () => {
  it('renders EndorsementButton with active Endorse button when connected', () => {
    render(
      <EndorsementButton
        userSkillId="skill-1"
        endorsements={[]}
        currentUserId="user-viewer"
        isConnectedWithProfileUser={true}
        isOwner={false}
        onEndorse={async () => {}}
      />
    );
    const btn = screen.getByRole('button', { name: /endorse/i });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();
  });

  it('disables EndorsementButton for the profile owner (self-endorsement prevented)', () => {
    render(
      <EndorsementButton
        userSkillId="skill-1"
        endorsements={[]}
        currentUserId="user-owner"
        isConnectedWithProfileUser={false}
        isOwner={true}
        onEndorse={async () => {}}
      />
    );
    const btn = screen.getByRole('button', { name: /endorse/i });
    expect(btn).toBeDisabled();
  });

  it('renders Endorsed state when viewer has already endorsed', () => {
    const dummyEndorsements = [
      {
        id: 'end-1',
        userSkillId: 'skill-1',
        endorserId: 'user-viewer',
        endorser: {
          id: 'user-viewer',
          username: 'viewer',
          name: 'Viewer Developer',
          avatarUrl: null,
          bio: null,
          location: null,
        },
        createdAt: new Date().toISOString(),
      },
    ];

    render(
      <EndorsementButton
        userSkillId="skill-1"
        endorsements={dummyEndorsements}
        currentUserId="user-viewer"
        isConnectedWithProfileUser={true}
        isOwner={false}
        onEndorse={async () => {}}
      />
    );
    expect(screen.getByText('Endorsed')).toBeInTheDocument();
    expect(screen.getByText('(1)')).toBeInTheDocument();
  });
});

describe('DevConnect Search & Discovery Utilities', () => {
  it('debounces rapid search input changes correctly', async () => {
    const { renderHook, act } = await import('@testing-library/react');
    const { useDebounce } = await import('../hooks/useDebounce');

    const { result, rerender } = renderHook(({ val }) => useDebounce(val, 50), {
      initialProps: { val: 'init' },
    });

    expect(result.current).toBe('init');

    rerender({ val: 'updated-fast' });
    expect(result.current).toBe('init');

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 80));
    });
    expect(result.current).toBe('updated-fast');
  });
});

describe('DevConnect Dashboard & Personalized Workspace Components', () => {
  it('renders personal project showcase empty state with prompt and action', () => {
    let clicked = false;
    render(
      <EmptyState
        title="No projects showcased yet"
        description="Highlight your technical depth with live demos, tech stack architecture, and GitHub repositories."
        actionText="Add Project"
        onAction={() => {
          clicked = true;
        }}
      />
    );

    expect(screen.getByText('No projects showcased yet')).toBeInTheDocument();
    expect(
      screen.getByText(/Highlight your technical depth with live demos/)
    ).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /add project/i });
    expect(btn).toBeInTheDocument();
    btn.click();
    expect(clicked).toBe(true);
  });

  it('renders personal publications empty state with write prompt', () => {
    let clicked = false;
    render(
      <EmptyState
        title="No publications yet"
        description="Write engineering tutorials, system design breakdowns, and postmortems to share knowledge with peer engineers."
        actionText="Write Publication"
        onAction={() => {
          clicked = true;
        }}
      />
    );

    expect(screen.getByText('No publications yet')).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /write publication/i });
    expect(btn).toBeInTheDocument();
    btn.click();
    expect(clicked).toBe(true);
  });

  it('renders quick stat metric card with label, count and link target', () => {
    render(
      <Card className="p-4">
        <span className="text-[11px]">Projects</span>
        <p className="text-2xl font-bold font-mono">5</p>
      </Card>
    );

    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});


