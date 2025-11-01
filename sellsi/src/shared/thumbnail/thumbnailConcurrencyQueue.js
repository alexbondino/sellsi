// thumbnailConcurrencyQueue.js - simple in-memory gate to limit concurrent thumbnail fetches
import { FeatureFlags } from '../../workspaces/supplier/home/utils/featureFlags.js';

const queue = [];
let active = 0;

export function scheduleThumbnailFetch(fn) {
  return new Promise((resolve, reject) => {
    queue.push({ fn, resolve, reject });
    drain();
  });
}

function drain() {
  while (active < FeatureFlags.THUMB_MAX_CONCURRENT && queue.length) {
    const { fn, resolve, reject } = queue.shift();
    active++;
    Promise.resolve()
      .then(fn)
      .then(res => resolve(res))
      .catch(err => reject(err))
      .finally(() => {
        active--;
        drain();
      });
  }
}

export function pendingThumbnailFetches() {
  return queue.length;
}
export function activeThumbnailFetches() {
  return active;
}

export default {
  scheduleThumbnailFetch,
  pendingThumbnailFetches,
  activeThumbnailFetches,
};
