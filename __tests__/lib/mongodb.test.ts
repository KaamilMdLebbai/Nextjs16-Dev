import mongoose from 'mongoose';

jest.mock('mongoose', () => ({
  connect: jest.fn(),
  connection: {
    readyState: 0,
  },
}));

describe('MongoDB Connection Utility', () => {
  let connectDB: () => Promise<typeof mongoose>;
  let originalEnv: NodeJS.ProcessEnv;
  let originalGlobalMongoose: any;

  beforeEach(() => {
    originalEnv = { ...process.env };
    originalGlobalMongoose = (global as any).mongoose;
    jest.resetModules();
    jest.clearAllMocks();
    delete (global as any).mongoose;
  });

  afterEach(() => {
    process.env = originalEnv;
    (global as any).mongoose = originalGlobalMongoose;
  });

  describe('Environment Variable Validation', () => {
    it('should throw error when MONGODB_URI is not defined', () => {
      delete process.env.MONGODB_URI;

      expect(() => {
        require('@/lib/mongodb');
      }).toThrow('Please define the MONGODB_URI environment variable inside .env.local');
    });

    it('should not throw error when MONGODB_URI is defined', () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

      expect(() => {
        require('@/lib/mongodb');
      }).not.toThrow();
    });
  });

  describe('Connection Caching', () => {
    beforeEach(() => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    });

    it('should return cached connection when available', async () => {
      const mockMongoose = { test: 'cached-connection' } as any;
      (global as any).mongoose = {
        conn: mockMongoose,
        promise: null,
      };

      connectDB = require('@/lib/mongodb').default;
      const result = await connectDB();

      expect(result).toBe(mockMongoose);
      expect(mongoose.connect).not.toHaveBeenCalled();
    });

    it('should create new connection when cache is empty', async () => {
      const mockMongoose = { test: 'new-connection' } as any;
      (mongoose.connect as jest.Mock).mockResolvedValue(mockMongoose);

      connectDB = require('@/lib/mongodb').default;
      const result = await connectDB();

      expect(mongoose.connect).toHaveBeenCalledWith(
        'mongodb://localhost:27017/test',
        { bufferCommands: false }
      );
      expect(result).toBe(mockMongoose);
    });

    it('should cache connection promise to prevent multiple connections', async () => {
      const mockMongoose = { test: 'connection' } as any;
      let resolvePromise: (value: any) => void;
      const connectionPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      (mongoose.connect as jest.Mock).mockReturnValue(connectionPromise);

      connectDB = require('@/lib/mongodb').default;

      const promise1 = connectDB();
      const promise2 = connectDB();

      resolvePromise!(mockMongoose);

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(mongoose.connect).toHaveBeenCalledTimes(1);
      expect(result1).toBe(mockMongoose);
      expect(result2).toBe(mockMongoose);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    });

    it('should reset promise cache on connection failure', async () => {
      const mockError = new Error('Connection failed');
      (mongoose.connect as jest.Mock).mockRejectedValue(mockError);

      connectDB = require('@/lib/mongodb').default;

      await expect(connectDB()).rejects.toThrow('Connection failed');

      expect((global as any).mongoose.promise).toBeNull();
    });

    it('should allow retry after failed connection', async () => {
      const mockError = new Error('First attempt failed');
      const mockMongoose = { test: 'retry-success' } as any;

      (mongoose.connect as jest.Mock)
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce(mockMongoose);

      connectDB = require('@/lib/mongodb').default;

      await expect(connectDB()).rejects.toThrow('First attempt failed');

      const result = await connectDB();
      expect(result).toBe(mockMongoose);
      expect(mongoose.connect).toHaveBeenCalledTimes(2);
    });
  });
});
  describe('Additional Connection Management', () => {
    beforeEach(() => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    });

    it('should handle multiple rapid connection attempts', async () => {
      const mockMongoose = { test: 'connection' } as any;
      (mongoose.connect as jest.Mock).mockResolvedValue(mockMongoose);

      connectDB = require('@/lib/mongodb').default;

      const promises = Array.from({ length: 10 }, () => connectDB());
      const results = await Promise.all(promises);

      expect(mongoose.connect).toHaveBeenCalledTimes(1);
      results.forEach(result => {
        expect(result).toBe(mockMongoose);
      });
    });

    it('should use bufferCommands: false option', async () => {
      const mockMongoose = { test: 'connection' } as any;
      (mongoose.connect as jest.Mock).mockResolvedValue(mockMongoose);

      connectDB = require('@/lib/mongodb').default;
      await connectDB();

      expect(mongoose.connect).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ bufferCommands: false })
      );
    });

    it('should maintain connection across module reloads', async () => {
      const mockMongoose = { test: 'persistent' } as any;
      (global as any).mongoose = {
        conn: mockMongoose,
        promise: null,
      };

      connectDB = require('@/lib/mongodb').default;
      const result1 = await connectDB();

      // Simulate module reload
      jest.resetModules();
      connectDB = require('@/lib/mongodb').default;
      const result2 = await connectDB();

      expect(result1).toBe(mockMongoose);
      expect(result2).toBe(mockMongoose);
      expect(mongoose.connect).not.toHaveBeenCalled();
    });

    it('should handle connection promise rejection gracefully', async () => {
      const mockError = new Error('Network timeout');
      (mongoose.connect as jest.Mock).mockRejectedValue(mockError);

      connectDB = require('@/lib/mongodb').default;

      await expect(connectDB()).rejects.toThrow('Network timeout');
      expect((global as any).mongoose.promise).toBeNull();
    });

    it('should create global mongoose cache if not exists', async () => {
      delete (global as any).mongoose;
      const mockMongoose = { test: 'new-cache' } as any;
      (mongoose.connect as jest.Mock).mockResolvedValue(mockMongoose);

      connectDB = require('@/lib/mongodb').default;
      await connectDB();

      expect((global as any).mongoose).toBeDefined();
      expect((global as any).mongoose.conn).toBe(mockMongoose);
    });
  });

  describe('Additional Error Scenarios', () => {
    beforeEach(() => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    });

    it('should handle authentication errors', async () => {
      const authError = new Error('Authentication failed');
      (mongoose.connect as jest.Mock).mockRejectedValue(authError);

      connectDB = require('@/lib/mongodb').default;

      await expect(connectDB()).rejects.toThrow('Authentication failed');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('ECONNREFUSED');
      (mongoose.connect as jest.Mock).mockRejectedValue(networkError);

      connectDB = require('@/lib/mongodb').default;

      await expect(connectDB()).rejects.toThrow('ECONNREFUSED');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Connection timeout');
      (mongoose.connect as jest.Mock).mockRejectedValue(timeoutError);

      connectDB = require('@/lib/mongodb').default;

      await expect(connectDB()).rejects.toThrow('Connection timeout');
    });

    it('should clean up on error', async () => {
      const error = new Error('Connection failed');
      (mongoose.connect as jest.Mock).mockRejectedValue(error);

      connectDB = require('@/lib/mongodb').default;

      try {
        await connectDB();
      } catch (e) {
        expect((global as any).mongoose.promise).toBeNull();
      }
    });
  });

  describe('Additional Cache Behavior', () => {
    beforeEach(() => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    });

    it('should initialize cache with null values', () => {
      delete (global as any).mongoose;
      
      require('@/lib/mongodb');

      expect((global as any).mongoose).toBeDefined();
      expect((global as any).mongoose.conn).toBeNull();
      expect((global as any).mongoose.promise).toBeNull();
    });

    it('should not override existing cache on import', async () => {
      const existingCache = {
        conn: { existing: 'connection' } as any,
        promise: null,
      };
      (global as any).mongoose = existingCache;

      connectDB = require('@/lib/mongodb').default;
      const result = await connectDB();

      expect(result).toBe(existingCache.conn);
      expect((global as any).mongoose).toBe(existingCache);
    });

    it('should share cache across multiple imports', () => {
      delete (global as any).mongoose;

      require('@/lib/mongodb');
      const cache1 = (global as any).mongoose;

      jest.resetModules();
      require('@/lib/mongodb');
      const cache2 = (global as any).mongoose;

      expect(cache2).toBe(cache1);
    });
  });

  describe('Additional Environment Validation', () => {
    it('should throw immediately when MONGODB_URI is undefined', () => {
      process.env.MONGODB_URI = undefined;

      expect(() => {
        require('@/lib/mongodb');
      }).toThrow('Please define the MONGODB_URI environment variable inside .env.local');
    });

    it('should throw immediately when MONGODB_URI is empty string', () => {
      process.env.MONGODB_URI = '';

      expect(() => {
        require('@/lib/mongodb');
      }).toThrow('Please define the MONGODB_URI environment variable inside .env.local');
    });

    it('should accept valid MongoDB URI formats', () => {
      const validURIs = [
        'mongodb://localhost:27017/test',
        'mongodb://user:pass@localhost:27017/test',
        'mongodb+srv://cluster.mongodb.net/test',
        'mongodb://localhost:27017,localhost:27018/test?replicaSet=rs0',
      ];

      validURIs.forEach(uri => {
        process.env.MONGODB_URI = uri;
        jest.resetModules();
        delete (global as any).mongoose;

        expect(() => {
          require('@/lib/mongodb');
        }).not.toThrow();
      });
    });
  });

  describe('Additional Connection State Management', () => {
    beforeEach(() => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    });

    it('should handle sequential connection attempts', async () => {
      const mockMongoose = { test: 'connection' } as any;
      (mongoose.connect as jest.Mock).mockResolvedValue(mockMongoose);

      connectDB = require('@/lib/mongodb').default;

      const result1 = await connectDB();
      const result2 = await connectDB();
      const result3 = await connectDB();

      expect(result1).toBe(mockMongoose);
      expect(result2).toBe(mockMongoose);
      expect(result3).toBe(mockMongoose);
      expect(mongoose.connect).toHaveBeenCalledTimes(1);
    });

    it('should handle connection after failed attempt', async () => {
      const error = new Error('First attempt failed');
      const mockMongoose = { test: 'success' } as any;

      (mongoose.connect as jest.Mock)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(mockMongoose);

      connectDB = require('@/lib/mongodb').default;

      await expect(connectDB()).rejects.toThrow('First attempt failed');
      
      const result = await connectDB();
      expect(result).toBe(mockMongoose);
    });

    it('should maintain connection state in global cache', async () => {
      const mockMongoose = { test: 'cached' } as any;
      (mongoose.connect as jest.Mock).mockResolvedValue(mockMongoose);

      connectDB = require('@/lib/mongodb').default;
      await connectDB();

      expect((global as any).mongoose.conn).toBe(mockMongoose);
      expect((global as any).mongoose.promise).toBeDefined();
    });
  });

  describe('Additional Concurrent Operation Tests', () => {
    beforeEach(() => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    });

    it('should handle race conditions in connection creation', async () => {
      let resolvePromise: (value: any) => void;
      const connectionPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      const mockMongoose = { test: 'concurrent' } as any;
      (mongoose.connect as jest.Mock).mockReturnValue(connectionPromise);

      connectDB = require('@/lib/mongodb').default;

      // Start multiple connections simultaneously
      const promise1 = connectDB();
      const promise2 = connectDB();
      const promise3 = connectDB();

      // Resolve after all promises are created
      resolvePromise!(mockMongoose);

      const [result1, result2, result3] = await Promise.all([
        promise1,
        promise2,
        promise3,
      ]);

      expect(result1).toBe(mockMongoose);
      expect(result2).toBe(mockMongoose);
      expect(result3).toBe(mockMongoose);
      expect(mongoose.connect).toHaveBeenCalledTimes(1);
    });

    it('should handle mixed success and error scenarios', async () => {
      const mockMongoose = { test: 'mixed' } as any;
      const error = new Error('Some connection failed');

      (mongoose.connect as jest.Mock)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(mockMongoose);

      connectDB = require('@/lib/mongodb').default;

      // First attempt fails
      await expect(connectDB()).rejects.toThrow('Some connection failed');

      // Second attempt succeeds
      const result = await connectDB();
      expect(result).toBe(mockMongoose);
    });
  });