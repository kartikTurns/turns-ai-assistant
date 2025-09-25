// Backend authentication service for validating tokens

interface AuthValidationRequest {
  accessToken: string;
  businessId: string;
  userId?: string;
}

interface AuthValidationResponse {
  status: boolean;
  message?: string;
  data?: any;
  meta?: any;
  validation_error?: any;
}

interface RefreshTokenResponse {
  status: boolean;
  message?: string;
  data?: {
    access_token?: string;
  };
  meta?: any;
  validation_error?: any;
}

class AuthService {
  private readonly AUTH_API_BASE_URL = 'https://sifabso.com/development';
  private readonly REDIRECT_URL = 'https://admin.turnsapp.com/';

  async validateAuth(accessToken: string, businessId: string, userId: string = '1'): Promise<AuthValidationResponse> {
    try {
      const currentDate = new Date().toISOString();
      const authApiUrl = `${this.AUTH_API_BASE_URL}/${businessId}/index.php/intapi/mobileAuth/validateAuth`;

      console.log(`Backend: Validating auth for business: ${businessId}`);
      console.log(`Backend: Auth API URL: ${authApiUrl}`);

      const response = await fetch(authApiUrl, {
        method: 'POST',
        headers: {
          'X-Date': currentDate,
          'Content-Type': 'application/json',
          'X-User-ID': userId,
          'X-Platform': 'ADMIN',
          'Authorization': `Bearer ${accessToken}`,
          // Note: Cookie header removed as it's not needed for API calls
        },
        body: JSON.stringify({}), // Empty body as per curl example
      });

      if (!response.ok) {
        console.error(`Backend: Auth API returned status: ${response.status}`);
        return {
          status: false,
          message: `Authentication API error: ${response.status} ${response.statusText}`
        };
      }

      const data: any = await response.json();
      console.log('Backend: Auth API response:', data);

      // Check if the status field in response is false (token expired or invalid)
      if (data.status === false) {
        console.log('Backend: Authentication failed - status is false');
        console.log('Backend: Auth failure reason:', data.message);
        return {
          status: false,
          message: data.message || 'Authentication failed',
          data: data.data,
          meta: data.meta,
          validation_error: data.validation_error
        };
      }

      console.log('Backend: Authentication successful');
      return {
        status: true,
        message: 'Authentication successful',
        data: data.data,
        meta: data.meta
      };

    } catch (error) {
      console.error('Backend: Error validating authentication:', error);
      return {
        status: false,
        message: `Authentication validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async refreshAccessToken(refreshToken: string, businessId: string, userId: string = '1'): Promise<RefreshTokenResponse> {
    try {
      const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
      const refreshApiUrl = `${this.AUTH_API_BASE_URL}/${businessId}/index.php/intapi/api/update_token`;

      console.log(`Backend: Refreshing access token for business: ${businessId}`);
      console.log(`Backend: Refresh API URL: ${refreshApiUrl}`);

      const response = await fetch(refreshApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId,
          'X-Platform': 'ADMIN',
          'X-Date': currentDate,
          'Authorization': `Bearer ${refreshToken}`,
          // Note: Cookie header removed as it's not needed for API calls
        },
        body: JSON.stringify({}), // Empty body
      });

      if (!response.ok) {
        console.error(`Backend: Refresh API returned status: ${response.status}`);
        return {
          status: false,
          message: `Token refresh API error: ${response.status} ${response.statusText}`
        };
      }

      const data: any = await response.json();
      console.log('Backend: Refresh API response:', data);

      // Check if the status field in response is false (refresh failed)
      if (data.status === false) {
        console.log('Backend: Token refresh failed - status is false');
        return {
          status: false,
          message: data.message || 'Token refresh failed',
          data: data.data,
          meta: data.meta,
          validation_error: data.validation_error
        };
      }

      console.log('Backend: Token refresh successful');
      return {
        status: true,
        message: data.message || 'Token refresh successful',
        data: data.data,
        meta: data.meta
      };

    } catch (error) {
      console.error('Backend: Error refreshing access token:', error);
      return {
        status: false,
        message: `Token refresh error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  getRedirectUrl(): string {
    return this.REDIRECT_URL;
  }
}

export const authService = new AuthService();
export type { AuthValidationRequest, AuthValidationResponse };