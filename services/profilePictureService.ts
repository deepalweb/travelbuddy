import { CurrentUser } from '../types.ts';

/**
 * Upload profile picture to the server
 */
export const uploadProfilePicture = async (
  userId: string,
  imageDataUrl: string
): Promise<{ success: boolean; profilePicture: string }> => {
  try {
    const response = await fetch(`/api/users/${userId}/profile-picture`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profilePicture: imageDataUrl,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload profile picture');
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw error;
  }
};

/**
 * Remove profile picture (set to null)
 */
export const removeProfilePicture = async (userId: string): Promise<{ success: boolean }> => {
  try {
    const response = await fetch(`/api/users/${userId}/profile-picture`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profilePicture: null,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to remove profile picture');
    }

    return await response.json();
  } catch (error) {
    console.error('Error removing profile picture:', error);
    throw error;
  }
};

/**
 * Get user profile data including profile picture
 */
export const getUserProfile = async (userId: string): Promise<CurrentUser> => {
  try {
    const response = await fetch(`/api/users/${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

/**
 * Generate a default avatar based on username
 */
export const generateDefaultAvatar = (username: string): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
  ];
  
  const color = colors[username.charCodeAt(0) % colors.length];
  const initial = username.charAt(0).toUpperCase();
  
  // Create a simple SVG avatar
  const svg = `
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="${color}"/>
      <text x="50" y="60" font-family="Arial, sans-serif" font-size="40" 
            font-weight="bold" text-anchor="middle" fill="white">${initial}</text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

/**
 * Validate image file
 */
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { isValid: false, error: 'File must be an image' };
  }
  
  // Check file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    return { isValid: false, error: 'File size must be less than 5MB' };
  }
  
  // Check dimensions (optional - could be added for specific requirements)
  return { isValid: true };
};

/**
 * Compress image if needed
 */
export const compressImage = (file: File, maxSize: number = 1024): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        file.type,
        0.8 // Quality
      );
    };
    
    img.src = URL.createObjectURL(file);
  });
}; 