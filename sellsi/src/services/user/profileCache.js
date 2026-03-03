// Small module to manage profile cache and enable test spying
const PROFILE_CACHE_TTL = 1_800_000; // 30 minutes
const profileCache = new Map();

export const getCachedUserProfileEntry = (userId) => {
  if (!userId) return null;
  return profileCache.get(userId) || null;
};

export const setCachedUserProfileEntry = (userId, data) => {
  if (!userId) return;
  profileCache.set(userId, { data, ts: Date.now() });
};

export const isCachedUserProfileValid = (entry) => {
  if (!entry?.ts) return false;
  return (Date.now() - entry.ts) < PROFILE_CACHE_TTL;
};

export const invalidateUserProfileCache = (userId) => {
  if (userId) {
    profileCache.delete(userId);
    return;
  }
  profileCache.clear();
};

export default invalidateUserProfileCache;
