import React, { useState } from 'react';
import { ThumbsUp, Check, Users } from 'lucide-react';
import { Endorsement } from '@devconnect/shared';
import { Avatar } from './Avatar';

export interface EndorsementButtonProps {
  userSkillId: string;
  endorsements: Endorsement[];
  currentUserId?: string;
  isConnectedWithProfileUser?: boolean;
  isOwner?: boolean;
  onEndorse: (userSkillId: string) => Promise<void>;
  onRemoveEndorsement?: (userSkillId: string) => Promise<void>;
  isLoading?: boolean;
}

export const EndorsementButton: React.FC<EndorsementButtonProps> = ({
  userSkillId,
  endorsements = [],
  currentUserId,
  isConnectedWithProfileUser = false,
  isOwner = false,
  onEndorse,
  onRemoveEndorsement,
  isLoading = false,
}) => {
  const [showEndorsers, setShowEndorsers] = useState(false);
  const [isHoveringEndorsed, setIsHoveringEndorsed] = useState(false);
  const count = endorsements.length;
  const isEndorsedByMe = endorsements.some((e) => e.endorserId === currentUserId);

  const canEndorse = !isOwner && currentUserId && isConnectedWithProfileUser && !isEndorsedByMe;

  const handleClick = () => {
    if (isEndorsedByMe && onRemoveEndorsement) {
      onRemoveEndorsement(userSkillId);
    } else if (canEndorse) {
      onEndorse(userSkillId);
    }
  };

  return (
    <div className="relative inline-flex items-center gap-1.5">
      {/* Endorse action button */}
      <button
        type="button"
        disabled={(!canEndorse && !isEndorsedByMe) || isLoading}
        onClick={handleClick}
        onMouseEnter={() => setIsHoveringEndorsed(true)}
        onMouseLeave={() => setIsHoveringEndorsed(false)}
        title={
          isOwner
            ? 'You cannot endorse your own skills'
            : !currentUserId
            ? 'Log in to endorse skills'
            : !isConnectedWithProfileUser
            ? 'Connect with developer to endorse skills'
            : isEndorsedByMe
            ? 'Click to remove endorsement'
            : 'Click to endorse this skill'
        }
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all duration-200 ${
          isEndorsedByMe
            ? isHoveringEndorsed && onRemoveEndorsement
              ? 'bg-rose-500/15 border-rose-500/30 text-rose-300 cursor-pointer active:scale-95'
              : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 cursor-pointer active:scale-95'
            : canEndorse
            ? 'bg-surface-100 hover:bg-brand-500/20 border-slate-700 hover:border-brand-500/50 text-slate-300 hover:text-white cursor-pointer active:scale-95'
            : 'bg-surface-100/50 border-slate-800 text-slate-400 cursor-default'
        }`}
      >
        {isEndorsedByMe ? (
          isHoveringEndorsed && onRemoveEndorsement ? (
            <>
              <ThumbsUp className="w-3.5 h-3.5 text-rose-400 rotate-180" />
              <span>Remove</span>
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Endorsed</span>
            </>
          )
        ) : (
          <>
            <ThumbsUp className="w-3.5 h-3.5 text-current" />
            <span>Endorse</span>
          </>
        )}
        <span className="ml-0.5 font-mono">({count})</span>
      </button>

      {/* View endorsers trigger */}
      {count > 0 && (
        <button
          type="button"
          onClick={() => setShowEndorsers(!showEndorsers)}
          className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-surface-50 transition-colors"
          title="View endorsers"
        >
          <Users className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Endorsers Popover */}
      {showEndorsers && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setShowEndorsers(false)}
          />
          <div className="absolute top-full left-0 mt-2 z-40 w-56 rounded-xl border border-surface-border bg-surface-200 p-3 shadow-xl animate-in zoom-in-95">
            <h5 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 font-mono">
              Endorsed By ({count})
            </h5>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {endorsements.map((e) => (
                <div key={e.id} className="flex items-center gap-2">
                  <Avatar src={e.endorser.avatarUrl} name={e.endorser.name} size="xs" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-200 truncate">{e.endorser.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">@{e.endorser.username}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
