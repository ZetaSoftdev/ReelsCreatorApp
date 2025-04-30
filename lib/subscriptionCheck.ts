import { prisma } from './prisma';

export async function canUploadVideo(userId: string) {
  try {
    // Get user with videos and subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        subscription: true,
        videos: {
          select: { id: true }
        }
      }
    });

    if (!user) {
      return { allowed: false, message: 'User not found' };
    }

    // Check if user has active subscription
    if (user.subscription?.status === 'active') {
      return { allowed: true };
    }

    // Check if user has already used free video
    const videoCount = user.videos?.length || 0;
    if (videoCount === 0) {
      return { allowed: true };
    }

    // User has used free video and has no subscription
    return {
      allowed: false,
      message: 'You have used your free video. Please subscribe to continue.'
    };
  } catch (error) {
    console.error('Error checking upload permission:', error);
    return { allowed: false, message: 'Error checking upload permission' };
  }
} 