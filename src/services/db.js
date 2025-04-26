// 使用 IndexedDB 作为本地数据库
const DB_NAME = 'RareDiseaseCommunityDB';
const DB_VERSION = 1;

// 存储库名称常量
const STORES = {
  POSTS: 'posts',
  USERS: 'users',
  COMMENTS: 'comments'
};

// 数据库结构
const DB_SCHEMA = {
  [STORES.POSTS]: {
    keyPath: 'id',
    indexes: [
      { name: 'authorId', keyPath: 'authorId' },
      { name: 'timestamp', keyPath: 'timestamp' },
      { name: 'type', keyPath: 'type' }
    ]
  },
  [STORES.USERS]: {
    keyPath: 'id',
    indexes: [
      { name: 'username', keyPath: 'username', unique: true }
    ]
  },
  [STORES.COMMENTS]: {
    keyPath: 'id',
    indexes: [
      { name: 'postId', keyPath: 'postId' },
      { name: 'authorId', keyPath: 'authorId' },
      { name: 'timestamp', keyPath: 'timestamp' }
    ]
  }
};

export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('无法打开数据库'));
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // 创建所有存储库和索引
      Object.entries(DB_SCHEMA).forEach(([storeName, schema]) => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { 
            keyPath: schema.keyPath,
            autoIncrement: true 
          });
          
          // 创建索引
          schema.indexes.forEach(index => {
            store.createIndex(index.name, index.keyPath, {
              unique: !!index.unique
            });
          });
        }
      });
    };
  });
};

export const addPost = async (post) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([POSTS_STORE], 'readwrite');
    const store = transaction.objectStore(POSTS_STORE);
    
    const request = store.add({
      ...post,
      timestamp: new Date().getTime(),
      likes: 0,
      comments: [],
      videoUrl: post.type === 'video' ? post.videoUrl : null,
      videoPoster: post.type === 'video' ? post.videoPoster : null
    });

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getPosts = async (options = {}) => {
  const {
    type = 'all',
    page = 1,
    limit = 10,
    authorId = null,
    status = 'published'
  } = options;

  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.POSTS], 'readonly');
    const store = transaction.objectStore(STORES.POSTS);
    const index = store.index('timestamp');
    
    const posts = [];
    let skipCount = (page - 1) * limit;
    let count = 0;

    index.openCursor(null, 'prev').onsuccess = (event) => {
      const cursor = event.target.result;
      
      if (cursor && count < limit) {
        const post = cursor.value;
        
        // 根据条件筛选帖子
        const typeMatch = type === 'all' || post.type === type;
        const authorMatch = !authorId || post.authorId === authorId;
        const statusMatch = post.status === status;
        
        if (skipCount > 0) {
          skipCount--;
          cursor.continue();
        } else if (typeMatch && authorMatch && statusMatch) {
          posts.push(post);
          count++;
          cursor.continue();
        } else {
          cursor.continue();
        }
      } else {
        resolve({
          posts,
          hasMore: cursor !== null,
          total: posts.length + skipCount
        });
      }
    };
  });
};

export const likePost = async (postId) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([POSTS_STORE], 'readwrite');
    const store = transaction.objectStore(POSTS_STORE);
    
    const request = store.get(postId);
    
    request.onsuccess = () => {
      const post = request.result;
      post.likes += 1;
      
      const updateRequest = store.put(post);
      updateRequest.onsuccess = () => resolve(post);
      updateRequest.onerror = () => reject(updateRequest.error);
    };
    
    request.onerror = () => reject(request.error);
  });
};

export const addComment = async (postId, comment) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([POSTS_STORE], 'readwrite');
    const store = transaction.objectStore(POSTS_STORE);
    
    const request = store.get(postId);
    
    request.onsuccess = () => {
      const post = request.result;
      post.comments.push({
        id: Date.now(),
        ...comment,
        timestamp: new Date().getTime()
      });
      
      const updateRequest = store.put(post);
      updateRequest.onsuccess = () => resolve(post);
      updateRequest.onerror = () => reject(updateRequest.error);
    };
    
    request.onerror = () => reject(request.error);
  });
};
