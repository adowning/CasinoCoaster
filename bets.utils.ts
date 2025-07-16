import { User } from '../client';
import { FormattedUser } from './bets.types';

/**
 * Formats a Prisma User object into a public-facing FormattedUser object.
 *
 * @param user - The full User object from the database.
 * @returns A user object safe for public consumption.
 */
export const formatUser = (user: User | null | undefined): FormattedUser | null => {
  if (!user) {
    return null;
  }

  // If the user is anonymous, return a generic anonymous user object
  if (user.anonymous) {
    return {
      id: user.id,
      username: 'Anonymous',
      avatar: null, // Or a default anonymous avatar
      rank: 'user',
      anonymous: true,
    };
  }

  return {
    id: user.id,
    username: user.username,
    avatar: user.avatar,
    rank: user.rank,
    anonymous: user.anonymous,
  };
};
