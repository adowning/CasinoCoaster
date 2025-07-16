import { DuelsBet, DuelsGame, User } from '../../client';

/**
 * Defines the shape of a user object formatted for public API responses.
 * Excludes sensitive information.
 */
export interface FormattedUser {
  id: string;
  username: string | null;
  avatar: string | null;
  rank: string;
  anonymous: boolean;
}

/**
 * Defines the shape of a single duel bet object.
 */
export interface DuelBet extends DuelsBet {
  user: FormattedUser | null;
}

/**
 * Defines the shape of a single duel game object.
 */
export interface DuelGame extends DuelsGame {
  bets: DuelBet[];
  winner?: DuelBet | null;
}

/**
 * Defines the application-specific data to be attached to each WebSocket connection.
 */
export interface AppSocketData {
    user?: User | null;
}
