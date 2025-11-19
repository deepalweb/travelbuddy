export interface ExtendedUserProfile {
  username?: string
  email?: string
  bio?: string
  website?: string
  location?: string
  birthday?: string
  languages?: string[]
  interests?: string[]
  budgetPreferences?: string[]
  showBirthdayToOthers?: boolean
  showLocationToOthers?: boolean
  profilePicture?: string
  status?: string
  travelStyle?: string
  homeCurrency?: string
}

class ProfileService {
  private baseURL: string

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net'
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}/api${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    const response = await fetch(url, config)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Request failed' }))
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
    }
    
    return response.json()
  }

  // Get extended user profile
  async getExtendedProfile(): Promise<ExtendedUserProfile | null> {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await this.request<ExtendedUserProfile>('/users/profile/extended', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return response
    } catch (error) {
      console.error('Error fetching extended profile:', error)
      return null
    }
  }

  // Update extended user profile
  async updateExtendedProfile(profileData: Partial<ExtendedUserProfile>): Promise<boolean> {
    try {
      const token = localStorage.getItem('auth_token')
      
      // Remove null/undefined values
      const cleanData = Object.fromEntries(
        Object.entries(profileData).filter(([_, value]) => value !== null && value !== undefined)
      )

      await this.request('/users/profile/extended', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(cleanData)
      })
      return true
    } catch (error) {
      console.error('Error updating extended profile:', error)
      return false
    }
  }

  // Update specific profile fields (matches mobile app method signature)
  async updateProfile({
    username,
    email,
    bio,
    website,
    location,
    birthday,
    languages,
    interests,
    budgetPreferences,
    showBirthdayToOthers,
    showLocationToOthers,
    profilePicture,
    status,
  }: Partial<ExtendedUserProfile>): Promise<boolean> {
    
    const profileData: Partial<ExtendedUserProfile> = {}
    
    if (username !== undefined) profileData.username = username
    if (email !== undefined) profileData.email = email
    if (bio !== undefined) profileData.bio = bio
    if (website !== undefined) profileData.website = website
    if (location !== undefined) profileData.location = location
    if (birthday !== undefined) profileData.birthday = birthday
    if (languages !== undefined) profileData.languages = languages
    if (interests !== undefined) profileData.interests = interests
    if (budgetPreferences !== undefined) profileData.budgetPreferences = budgetPreferences
    if (showBirthdayToOthers !== undefined) profileData.showBirthdayToOthers = showBirthdayToOthers
    if (showLocationToOthers !== undefined) profileData.showLocationToOthers = showLocationToOthers
    if (profilePicture !== undefined) profileData.profilePicture = profilePicture
    if (status !== undefined) profileData.status = status

    return await this.updateExtendedProfile(profileData)
  }

  // Upload profile picture
  async uploadProfilePicture(file: File): Promise<string | null> {
    try {
      const token = localStorage.getItem('auth_token')
      const formData = new FormData()
      formData.append('profilePicture', file)

      const response = await fetch(`${this.baseURL}/api/users/profile/picture`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })

      if (!response.ok) throw new Error('Upload failed')
      
      const result = await response.json()
      return result.profilePictureUrl
    } catch (error) {
      console.error('Error uploading profile picture:', error)
      return null
    }
  }
}

export const profileService = new ProfileService()