// Small module to manage profile cache and enable test spying
const PROFILE_CACHE_TTL = 1_800_000; // 30 minutes
const profileCache = new Map();

export const invalidateUserProfileCache = (userId) => {
  if (userId) {
    profileCache.delete(userId);
    return;
  }
  profileCache.clear();
};

export default invalidateUserProfileCache;
