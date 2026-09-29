import { useEffect, useState } from 'react';
import { Color } from 'chess.js';
import { t } from '../i18n';
import { Platform } from '../importers/types';

export interface PlayerInfo {
  color: Color;
  username?: string;
  rating?: number;
  /** Platform the username belongs to; avatars are only available from Chess.com */
  platform?: Platform;
}

interface PlayerBarProps {
  player: PlayerInfo;
}

// Avatar URLs by username; null means the player has no avatar or the request failed
const avatarCache = new Map<string, string | null>();

/**
 * Fetch a chess.com player's avatar from https://api.chess.com/pub/player/{username}
 */
function useChessComAvatar(username?: string) {
  const [avatar, setAvatar] = useState<string | null>(
    username ? avatarCache.get(username.toLowerCase()) ?? null : null
  );

  useEffect(() => {
    if (!username) {
      setAvatar(null);
      return;
    }

    const key = username.toLowerCase();
    if (avatarCache.has(key)) {
      setAvatar(avatarCache.get(key)!);
      return;
    }

    let cancelled = false;
    setAvatar(null);
    fetch(`https://api.chess.com/pub/player/${encodeURIComponent(key)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => typeof data?.avatar === 'string' ? data.avatar : null)
      .catch(() => null)
      .then((url) => {
        avatarCache.set(key, url);
        if (!cancelled) setAvatar(url);
      });

    return () => {
      cancelled = true;
    };
  }, [username]);

  return avatar;
}

/**
 * Player row shown above/below the board: avatar, name and rating.
 * Without an avatar (free play, Lichess, computer) it shows the piece color instead.
 */
export function PlayerBar({ player }: PlayerBarProps) {
  const avatar = useChessComAvatar(player.platform === 'chesscom' ? player.username : undefined);
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);
  const name = player.username ?? t(player.color === 'w' ? 'player.white' : 'player.black');
  const showAvatar = avatar && avatar !== failedAvatar;

  return (
    <div className="flex items-center gap-2 min-w-0">
      {showAvatar ? (
        <img
          src={avatar}
          alt={name}
          onError={() => setFailedAvatar(avatar)}
          className="w-8 h-8 rounded-md object-cover shrink-0 bg-gray-700"
        />
      ) : (
        <div
          className={`w-8 h-8 rounded-md shrink-0 border border-gray-600 ${
            player.color === 'w' ? 'bg-gray-100' : 'bg-gray-950'
          }`}
        />
      )}
      <span className="text-white font-semibold truncate">{name}</span>
      {player.rating !== undefined && (
        <span className="text-gray-400 text-sm shrink-0">({player.rating})</span>
      )}
    </div>
  );
}
