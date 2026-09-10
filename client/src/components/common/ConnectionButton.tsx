import React, { useState } from 'react';
import { UserPlus, UserCheck, Clock, UserX, Check, X } from 'lucide-react';
import { ConnectionStatus } from '@devconnect/shared';
import { Button } from './Button';

export interface ConnectionButtonProps {
  status?: ConnectionStatus | 'NONE' | 'SELF';
  connectionId?: string;
  isRequester?: boolean;
  onConnect: () => Promise<void>;
  onRespond?: (action: 'ACCEPT' | 'REJECT') => Promise<void>;
  onRemove?: () => Promise<void>;
  isLoading?: boolean;
}

export const ConnectionButton: React.FC<ConnectionButtonProps> = ({
  status = 'NONE',
  isRequester = false,
  onConnect,
  onRespond,
  onRemove,
  isLoading = false,
}) => {
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);

  if (status === 'SELF') {
    return null;
  }

  if (status === 'NONE') {
    return (
      <Button
        variant="primary"
        size="sm"
        onClick={onConnect}
        isLoading={isLoading}
        leftIcon={<UserPlus className="w-4 h-4" />}
      >
        Connect
      </Button>
    );
  }

  if (status === ConnectionStatus.PENDING) {
    if (isRequester) {
      return (
        <Button
          variant="secondary"
          size="sm"
          disabled
          leftIcon={<Clock className="w-4 h-4 text-amber-400" />}
        >
          Request Sent
        </Button>
      );
    }

    // Incoming request
    return (
      <div className="flex items-center gap-1.5">
        <Button
          variant="primary"
          size="sm"
          onClick={() => onRespond && onRespond('ACCEPT')}
          isLoading={isLoading}
          leftIcon={<Check className="w-4 h-4" />}
        >
          Accept
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onRespond && onRespond('REJECT')}
          isLoading={isLoading}
          leftIcon={<X className="w-4 h-4" />}
        >
          Decline
        </Button>
      </div>
    );
  }

  if (status === ConnectionStatus.ACCEPTED) {
    if (showConfirmRemove) {
      return (
        <div className="flex items-center gap-1.5">
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              setShowConfirmRemove(false);
              onRemove && onRemove();
            }}
            isLoading={isLoading}
            leftIcon={<UserX className="w-4 h-4" />}
          >
            Confirm Disconnect
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowConfirmRemove(false)}
          >
            Cancel
          </Button>
        </div>
      );
    }

    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowConfirmRemove(true)}
        className="border-emerald-500/40 text-emerald-400 hover:border-rose-500 hover:text-rose-400"
        leftIcon={<UserCheck className="w-4 h-4 text-emerald-400" />}
      >
        Connected
      </Button>
    );
  }

  return (
    <Button
      variant="primary"
      size="sm"
      onClick={onConnect}
      isLoading={isLoading}
      leftIcon={<UserPlus className="w-4 h-4" />}
    >
      Connect
    </Button>
  );
};
