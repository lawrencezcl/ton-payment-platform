import crypto from 'crypto';

export function validateTelegramInitData(
  initData: string, 
  botToken: string,
  maxAgeSeconds: number = 300 // Default 5 minutes
): boolean {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    const authDate = urlParams.get('auth_date');
    
    if (!hash || !authDate) {
      return false;
    }

    // Check auth_date freshness to prevent replay attacks
    const authTimestamp = parseInt(authDate, 10);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    
    if (isNaN(authTimestamp) || currentTimestamp - authTimestamp > maxAgeSeconds) {
      console.warn('Telegram init data expired or invalid auth_date');
      return false;
    }

    urlParams.delete('hash');
    
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Use constant-time comparison to prevent timing attacks
    if (hash.length !== calculatedHash.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      Buffer.from(calculatedHash, 'hex')
    );
  } catch (error) {
    console.error('Telegram init data validation error:', error);
    return false;
  }
}

export function parseTelegramUser(initData: string) {
  try {
    const urlParams = new URLSearchParams(initData);
    const userStr = urlParams.get('user');
    
    if (!userStr) {
      return null;
    }

    return JSON.parse(decodeURIComponent(userStr));
  } catch (error) {
    console.error('Failed to parse Telegram user:', error);
    return null;
  }
}
