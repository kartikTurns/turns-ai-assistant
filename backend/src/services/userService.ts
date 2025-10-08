// User service - handles user authentication and token management
import { User, IUser } from '../models/User';

export class UserService {
  /**
   * Create or update user on login
   * If user exists -> update tokens and lastLoginAt
   * If new user -> create new record
   */
  async loginOrCreateUser(
    businessId: string,
    accessToken: string,
    refreshToken?: string,
    ip?: string
  ): Promise<IUser> {
    // Try to find existing user
    let user = await User.findOne({ businessId }).exec();

    if (user) {
      // User exists - update
      user.accessToken = accessToken;
      if (refreshToken) {
        user.refreshToken = refreshToken;
      }
      user.lastLoginAt = new Date();
      user.metadata.loginCount += 1;
      if (ip) {
        user.metadata.lastIp = ip;
      }
      await user.save();
    } else {
      // New user - create with try-catch for race condition
      try {
        user = new User({
          businessId,
          accessToken,
          refreshToken,
          lastLoginAt: new Date(),
          tokenBalance: 1000000, // 1 million tokens for new users
          metadata: {
            loginCount: 1,
            lastIp: ip
          }
        });
        await user.save();
        console.log(`✨ New user created: ${businessId} with 1,000,000 tokens`);
      } catch (error: any) {
        // If duplicate key error (race condition), fetch the user
        if (error.code === 11000) {
          user = await User.findOne({ businessId }).exec();
          if (!user) {
            throw new Error('User creation failed');
          }
          // Update the user that was just created by another request
          user.accessToken = accessToken;
          if (refreshToken) {
            user.refreshToken = refreshToken;
          }
          user.lastLoginAt = new Date();
          user.metadata.loginCount += 1;
          if (ip) {
            user.metadata.lastIp = ip;
          }
          await user.save();
        } else {
          throw error;
        }
      }
    }

    return user;
  }

  /**
   * Get user by businessId
   */
  async getUserByBusinessId(businessId: string): Promise<IUser | null> {
    return await User.findOne({ businessId }).exec();
  }

  /**
   * Verify if user exists and has valid token
   */
  async verifyUser(businessId: string, accessToken: string): Promise<boolean> {
    const user = await User.findOne({ businessId, accessToken }).exec();
    return !!user;
  }

  /**
   * Update user tokens
   */
  async updateTokens(
    businessId: string,
    accessToken: string,
    refreshToken?: string
  ): Promise<IUser | null> {
    const updateData: any = { accessToken };
    if (refreshToken) {
      updateData.refreshToken = refreshToken;
    }

    return await User.findOneAndUpdate(
      { businessId },
      updateData,
      { new: true }
    ).exec();
  }

  /**
   * Get user statistics
   */
  async getUserStats(businessId: string): Promise<{
    loginCount: number;
    lastLoginAt: Date;
    createdAt: Date;
  } | null> {
    const user = await User.findOne({ businessId }).exec();
    if (!user) return null;

    return {
      loginCount: user.metadata.loginCount,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt
    };
  }
}

export const userService = new UserService();
