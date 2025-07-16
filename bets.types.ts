import { User } from '../client';

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
 * Defines the shape of a single bet object used across different game modes.
 */
export interface Bet {
  amount: number | null;
  payout: number | null;
  multiplier: number | null;
  user: FormattedUser | null;
  updatedAt: Date;
  createdAt: Date;
  method: string;
}

/**
 * Defines the structure for the collection of bets sent to the client.
 */
export interface Bets {
  all: Bet[];
  whale: Bet[];
  lucky: Bet[];
  my: Bet[];
}

/**
 * Defines the application-specific data to be attached to each WebSocket connection.
 */
export interface AppSocketData {
    user?: User | null;
}
