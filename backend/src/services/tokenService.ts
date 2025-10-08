// Token service - manages user token balance
import { User } from '../models/User';

export class TokenService {
  /**
   * Get user's token balance
   */
  async getTokenBalance(businessId: string): Promise<number | null> {
    const user = await User.findOne({ businessId }).exec();
    return user ? user.tokenBalance : null;
  }

  /**
   * Deduct tokens from user balance
   * Returns new balance, or null if insufficient tokens
   */
  async deductTokens(
    businessId: string,
    tokensUsed: number
  ): Promise<{ success: boolean; newBalance?: number; message?: string }> {
    const user = await User.findOne({ businessId }).exec();

    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    // Check if user has enough tokens
    if (user.tokenBalance < tokensUsed) {
      return {
        success: false,
        message: `Insufficient tokens. Available: ${user.tokenBalance}, Required: ${tokensUsed}`,
        newBalance: user.tokenBalance
      };
    }

    // Deduct tokens
    user.tokenBalance -= tokensUsed;
    await user.save();

    return {
      success: true,
      newBalance: user.tokenBalance,
      message: `Deducted ${tokensUsed} tokens. New balance: ${user.tokenBalance}`
    };
  }

  /**
   * Add tokens to user balance (for admin/top-up)
   */
  async addTokens(
    businessId: string,
    tokensToAdd: number
  ): Promise<{ success: boolean; newBalance?: number; message?: string }> {
    const user = await User.findOne({ businessId }).exec();

    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    user.tokenBalance += tokensToAdd;
    await user.save();

    return {
      success: true,
      newBalance: user.tokenBalance,
      message: `Added ${tokensToAdd} tokens. New balance: ${user.tokenBalance}`
    };
  }

  /**
   * Check if user has enough tokens
   */
  async hasEnoughTokens(businessId: string, requiredTokens: number): Promise<boolean> {
    const user = await User.findOne({ businessId }).exec();
    return user ? user.tokenBalance >= requiredTokens : false;
  }

  /**
   * Get token usage statistics for a user
   */
  async getTokenStats(businessId: string): Promise<{
    balance: number;
    percentageUsed: number;
    tokensUsed: number;
  } | null> {
    const user = await User.findOne({ businessId }).exec();

    if (!user) return null;

    const initialBalance = 1000000; // 1 million initial tokens
    const tokensUsed = initialBalance - user.tokenBalance;
    const percentageUsed = (tokensUsed / initialBalance) * 100;

    return {
      balance: user.tokenBalance,
      tokensUsed,
      percentageUsed: Math.round(percentageUsed * 100) / 100 // Round to 2 decimals
    };
  }
}

export const tokenService = new TokenService();
