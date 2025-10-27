// Utility functions for handling images

export const preloadImage = (src: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
};

export const testImageUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

export const getOptimizedImageUrl = (originalUrl: string, width: number, height: number): string => {
  // For Unsplash images, optimize the URL
  if (originalUrl.includes('unsplash.com')) {
    const baseUrl = originalUrl.split('?')[0];
    return `${baseUrl}?w=${width}&h=${height}&fit=crop&auto=format&q=60`;
  }
  
  return originalUrl;
};

export const generatePlaceholderUrl = (text: string, width: number = 600, height: number = 400): string => {
  return `https://via.placeholder.com/${width}x${height}/6366f1/ffffff?text=${encodeURIComponent(text)}`;
};

// Debug function to test all image URLs
export const debugImageUrls = async (urls: string[]): Promise<void> => {
  console.log('🖼️ Testing image URLs...');
  
  for (const url of urls) {
    try {
      const isValid = await testImageUrl(url);
      console.log(`${isValid ? '✅' : '❌'} ${url}`);
    } catch (error) {
      console.log(`❌ ${url} - Error: ${error}`);
    }
  }
};