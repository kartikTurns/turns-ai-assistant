// Frontend authentication service for validating tokens

interface AuthValidationResponse {
  status: boolean;
  message?: string;
  data?: any;
}

export class FrontendAuthService {
  private readonly AUTH_API_BASE_URL = 'https://sifabso.com/development';
  private readonly REDIRECT_URL = 'https://admin.turnsapp.com/';

  async validateAuth(accessToken: string, businessId: string, userId: string = '1'): Promise<AuthValidationResponse> {
    try {
      const currentDate = new Date().toISOString();
      const authApiUrl = `${this.AUTH_API_BASE_URL}/${businessId}/index.php/intapi/mobileAuth/validateAuth`;

      console.log(`Frontend: Validating auth for business: ${businessId}`);
      console.log(`Frontend: Auth API URL: ${authApiUrl}`);

      const response = await fetch(authApiUrl, {
        method: 'POST',
        headers: {
          'X-Date': currentDate,
          'Content-Type': 'application/json',
          'X-User-ID': userId,
          'X-Platform': 'ADMIN',
          'Authorization': `Bearer ${accessToken}`,
          // Note: Cookie header removed as it's not needed for API calls from frontend
        },
        body: JSON.stringify({}), // Empty body as per curl example
      });

      if (!response.ok) {
        console.error(`Frontend: Auth API returned status: ${response.status}`);
        return {
          status: false,
          message: `Authentication API error: ${response.status} ${response.statusText}`
        };
      }

      const data: any = await response.json();
      console.log('Frontend: Auth API response:', data);

      // Check if the status field in response is false
      if (data.status === false) {
        console.log('Frontend: Authentication failed - status is false');
        return {
          status: false,
          message: data.message || 'Authentication failed',
          data: data
        };
      }

      console.log('Frontend: Authentication successful');
      return {
        status: true,
        message: 'Authentication successful',
        data: data
      };

    } catch (error) {
      console.error('Frontend: Error validating authentication:', error);
      return {
        status: false,
        message: `Authentication validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  getRedirectUrl(): string {
    return this.REDIRECT_URL;
  }
}

export const frontendAuthService = new FrontendAuthService();