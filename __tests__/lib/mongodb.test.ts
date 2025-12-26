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