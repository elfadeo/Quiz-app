// Storage polyfill for browsers (Claude.ai has window.storage built-in)
if (typeof window !== 'undefined' && !window.storage) {
  window.storage = {
    async get(key, shared = false) {
      try {
        const storageKey = shared ? `shared_${key}` : `user_${key}`;
        const value = localStorage.getItem(storageKey);
        return value ? { key, value, shared } : null;
      } catch (e) {
        console.error('Storage get error:', e);
        return null;
      }
    },
    
    async set(key, value, shared = false) {
      try {
        const storageKey = shared ? `shared_${key}` : `user_${key}`;
        localStorage.setItem(storageKey, value);
        return { key, value, shared };
      } catch (e) {
        console.error('Storage set error:', e);
        return null;
      }
    },
    
    async delete(key, shared = false) {
      try {
        const storageKey = shared ? `shared_${key}` : `user_${key}`;
        localStorage.removeItem(storageKey);
        return { key, deleted: true, shared };
      } catch (e) {
        console.error('Storage delete error:', e);
        return null;
      }
    },
    
    async list(prefix = '', shared = false) {
      try {
        const storagePrefix = shared ? `shared_` : `user_`;
        const fullPrefix = storagePrefix + prefix;
        const keys = [];
        
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key.startsWith(fullPrefix)) {
            keys.push(key.replace(storagePrefix, ''));
          }
        }
        
        return { keys, prefix, shared };
      } catch (e) {
        console.error('Storage list error:', e);
        return null;
      }
    }
  };
}