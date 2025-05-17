import { SocialMediaAccount } from "@prisma/client";
import { decrypt } from "@/lib/encryption";
import { refreshAccessToken } from "@/lib/social/oauth-service";

/**
 * YouTube API client for working with channel data and videos
 */
export class YouTubeAPI {
  private accessToken: string;
  private accountId: string;
  
  /**
   * Initialize a YouTube API client with a social media account
   */
  private constructor(accessToken: string, accountId: string) {
    this.accessToken = accessToken;
    this.accountId = accountId;
  }
  
  /**
   * Create a YouTube API client from a social media account
   */
  public static async fromAccount(account: SocialMediaAccount): Promise<YouTubeAPI> {
    // Ensure the token is fresh
    const refreshedAccount = await refreshAccessToken(account);
    const accessToken = decrypt(refreshedAccount.accessToken);
    
    return new YouTubeAPI(accessToken, account.id);
  }
  
  /**
   * Make an authenticated request to the YouTube API
   */
  private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${this.accessToken}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`YouTube API error (${response.status}): ${errorText}`);
    }
    
    return await response.json() as T;
  }
  
  /**
   * Get the authenticated user's channel information
   */
  async getChannel() {
    const data = await this.request('https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true');
    
    if (!data.items || data.items.length === 0) {
      throw new Error('No YouTube channel found');
    }
    
    const channel = data.items[0];
    
    return {
      id: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      customUrl: channel.snippet.customUrl,
      thumbnails: channel.snippet.thumbnails,
      statistics: channel.statistics
    };
  }
  
  /**
   * Get videos from the authenticated user's channel
   */
  async getVideos(maxResults = 10) {
    const channel = await this.getChannel();
    
    const data = await this.request(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channel.id}&maxResults=${maxResults}&order=date&type=video`
    );
    
    return data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnails: item.snippet.thumbnails,
      publishedAt: item.snippet.publishedAt,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`
    }));
  }
  
  /**
   * Get analytics for the authenticated user's channel
   */
  async getAnalytics() {
    try {
      // This would require the YouTube Analytics API
      // For demonstration purposes, we'll return mock data
      return {
        views: Math.floor(Math.random() * 10000),
        subscribers: Math.floor(Math.random() * 1000),
        likes: Math.floor(Math.random() * 5000),
        comments: Math.floor(Math.random() * 500)
      };
    } catch (error) {
      console.error('Error fetching YouTube analytics:', error);
      throw error;
    }
  }
}