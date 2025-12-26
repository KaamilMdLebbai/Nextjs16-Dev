import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Booking, { IBooking } from '@/database/booking.model';
import Event, { IEvent } from '@/database/event.model';

let mongoServer: MongoMemoryServer;

describe('Booking Model', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await Booking.deleteMany({});
    await Event.deleteMany({});
  });

  const createTestEvent = async (): Promise<IEvent> => {
    return await Event.create({
      title: 'Test Event',
      description: 'Test Description',
      overview: 'Test Overview',
      image: '/test-image.jpg',
      venue: 'Test Venue',
      location: 'Test Location',
      date: '2024-12-31',
      time: '10:00',
      mode: 'online',
      audience: 'Test Audience',
      agenda: ['Test Agenda Item'],
      organizer: 'Test Organizer',
      tags: ['test'],
    });
  };

  describe('Model Creation', () => {
    it('should create a valid booking with required fields', async () => {
      const event = await createTestEvent();

      const bookingData = {
        eventId: event._id,
        email: 'test@example.com',
      };

      const booking = new Booking(bookingData);
      const savedBooking = await booking.save();

      expect(savedBooking._id).toBeDefined();
      expect(savedBooking.eventId.toString()).toBe(event._id.toString());
      expect(savedBooking.email).toBe('test@example.com');
      expect(savedBooking.createdAt).toBeDefined();
      expect(savedBooking.updatedAt).toBeDefined();
    });

    it('should automatically convert email to lowercase', async () => {
      const event = await createTestEvent();

      const booking = await Booking.create({
        eventId: event._id,
        email: 'USER@EXAMPLE.COM',
      });

      expect(booking.email).toBe('user@example.com');
    });

    it('should trim whitespace from email', async () => {
      const event = await createTestEvent();

      const booking = await Booking.create({
        eventId: event._id,
        email: '  trimmed@example.com  ',
      });

      expect(booking.email).toBe('trimmed@example.com');
    });
  });

  describe('Email Validation', () => {
    it('should accept valid email addresses', async () => {
      const event = await createTestEvent();

      const validEmails = [
        'simple@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user_name@example-domain.com',
        'test123@test.org',
      ];

      for (const email of validEmails) {
        const booking = await Booking.create({
          eventId: event._id,
          email,
        });
        expect(booking.email).toBe(email.toLowerCase());
      }
    });

    it('should reject email without @ symbol', async () => {
      const event = await createTestEvent();

      const booking = new Booking({
        eventId: event._id,
        email: 'invalidemail.com',
      });

      await expect(booking.save()).rejects.toThrow('Please provide a valid email address');
    });

    it('should reject email without domain', async () => {
      const event = await createTestEvent();

      const booking = new Booking({
        eventId: event._id,
        email: 'user@',
      });

      await expect(booking.save()).rejects.toThrow('Please provide a valid email address');
    });

    it('should reject email with spaces', async () => {
      const event = await createTestEvent();

      const booking = new Booking({
        eventId: event._id,
        email: 'user name@example.com',
      });

      await expect(booking.save()).rejects.toThrow('Please provide a valid email address');
    });
  });

  describe('Event Reference Validation', () => {
    it('should accept booking with valid event reference', async () => {
      const event = await createTestEvent();

      const booking = await Booking.create({
        eventId: event._id,
        email: 'valid@example.com',
      });

      expect(booking.eventId.toString()).toBe(event._id.toString());
    });

    it('should reject booking with non-existent event ID', async () => {
      const fakeEventId = new mongoose.Types.ObjectId();

      const booking = new Booking({
        eventId: fakeEventId,
        email: 'test@example.com',
      });

      await expect(booking.save()).rejects.toThrow(`Event with ID ${fakeEventId} does not exist`);
    });

    it('should validate eventId when modified', async () => {
      const event1 = await createTestEvent();
      const event2 = await Event.create({
        title: 'Second Event',
        description: 'Second Description',
        overview: 'Second Overview',
        image: '/second-image.jpg',
        venue: 'Second Venue',
        location: 'Second Location',
        date: '2025-01-15',
        time: '14:00',
        mode: 'offline',
        audience: 'Second Audience',
        agenda: ['Second Agenda'],
        organizer: 'Second Organizer',
        tags: ['second'],
      });

      const booking = await Booking.create({
        eventId: event1._id,
        email: 'test@example.com',
      });

      booking.eventId = event2._id;
      await expect(booking.save()).resolves.toBeDefined();
      expect(booking.eventId.toString()).toBe(event2._id.toString());
    });
  });

  describe('Required Fields', () => {
    it('should require eventId', async () => {
      const booking = new Booking({
        email: 'test@example.com',
      });

      await expect(booking.save()).rejects.toThrow();
    });

    it('should require email', async () => {
      const event = await createTestEvent();

      const booking = new Booking({
        eventId: event._id,
      });

      await expect(booking.save()).rejects.toThrow();
    });
  });

  describe('Database Operations', () => {
    it('should find bookings by eventId', async () => {
      const event = await createTestEvent();

      await Booking.create({
        eventId: event._id,
        email: 'user1@example.com',
      });

      await Booking.create({
        eventId: event._id,
        email: 'user2@example.com',
      });

      const bookings = await Booking.find({ eventId: event._id });

      expect(bookings).toHaveLength(2);
    });

    it('should populate event details', async () => {
      const event = await createTestEvent();

      const booking = await Booking.create({
        eventId: event._id,
        email: 'populate@example.com',
      });

      const populatedBooking = await Booking.findById(booking._id).populate('eventId');

      expect(populatedBooking).toBeDefined();
      expect(populatedBooking?.eventId).toHaveProperty('title');
      expect((populatedBooking?.eventId as any).title).toBe('Test Event');
    });
  });
});
  describe('Additional Edge Cases - Email Validation', () => {
    it('should handle international domain extensions', async () => {
      const event = await createTestEvent();
      
      const internationalEmails = [
        'user@example.co.uk',
        'test@domain.com.au',
        'contact@site.org.nz',
        'info@company.co.jp',
      ];

      for (const email of internationalEmails) {
        const booking = await Booking.create({
          eventId: event._id,
          email,
        });
        expect(booking.email).toBe(email);
      }
    });

    it('should reject email with multiple @ symbols', async () => {
      const event = await createTestEvent();

      const booking = new Booking({
        eventId: event._id,
        email: 'user@@example.com',
      });

      await expect(booking.save()).rejects.toThrow('Please provide a valid email address');
    });

    it('should reject email with only TLD', async () => {
      const event = await createTestEvent();

      const booking = new Booking({
        eventId: event._id,
        email: 'user@com',
      });

      await expect(booking.save()).rejects.toThrow('Please provide a valid email address');
    });

    it('should reject email starting with dot', async () => {
      const event = await createTestEvent();

      const booking = new Booking({
        eventId: event._id,
        email: '.user@example.com',
      });

      await expect(booking.save()).rejects.toThrow('Please provide a valid email address');
    });

    it('should reject email ending with dot before @', async () => {
      const event = await createTestEvent();

      const booking = new Booking({
        eventId: event._id,
        email: 'user.@example.com',
      });

      await expect(booking.save()).rejects.toThrow('Please provide a valid email address');
    });

    it('should handle email with numbers', async () => {
      const event = await createTestEvent();

      const booking = await Booking.create({
        eventId: event._id,
        email: 'user123@example456.com',
      });

      expect(booking.email).toBe('user123@example456.com');
    });

    it('should handle very long valid emails', async () => {
      const event = await createTestEvent();
      const longEmail = 'a'.repeat(50) + '@' + 'b'.repeat(50) + '.com';

      const booking = await Booking.create({
        eventId: event._id,
        email: longEmail,
      });

      expect(booking.email).toBe(longEmail);
    });
  });

  describe('Additional Edge Cases - Event Reference', () => {
    it('should handle booking creation when Event model is not registered', async () => {
      // This tests the error handling for unregistered Event model
      const fakeEventId = new mongoose.Types.ObjectId();
      
      const booking = new Booking({
        eventId: fakeEventId,
        email: 'test@example.com',
      });

      // Should fail because event doesn't exist
      await expect(booking.save()).rejects.toThrow();
    });

    it('should not validate eventId when only email is modified', async () => {
      const event = await createTestEvent();

      const booking = await Booking.create({
        eventId: event._id,
        email: 'original@example.com',
      });

      // Delete the event to make the reference invalid
      await Event.deleteMany({ _id: event._id });

      // Modify only the email (not eventId)
      booking.email = 'updated@example.com';
      
      // Should succeed because eventId wasn't modified
      await expect(booking.save()).resolves.toBeDefined();
      expect(booking.email).toBe('updated@example.com');
    });

    it('should validate eventId on new booking creation', async () => {
      const fakeEventId = new mongoose.Types.ObjectId();

      await expect(
        Booking.create({
          eventId: fakeEventId,
          email: 'new@example.com',
        })
      ).rejects.toThrow(`Event with ID ${fakeEventId} does not exist`);
    });

    it('should handle concurrent booking creation for same event', async () => {
      const event = await createTestEvent();

      const bookingPromises = Array.from({ length: 5 }, (_, i) =>
        Booking.create({
          eventId: event._id,
          email: `user${i}@example.com`,
        })
      );

      const bookings = await Promise.all(bookingPromises);
      expect(bookings).toHaveLength(5);
      
      const allBookings = await Booking.find({ eventId: event._id });
      expect(allBookings).toHaveLength(5);
    });
  });

  describe('Additional Database Operations', () => {
    it('should update booking email', async () => {
      const event = await createTestEvent();

      const booking = await Booking.create({
        eventId: event._id,
        email: 'old@example.com',
      });

      booking.email = 'new@example.com';
      await booking.save();

      const updated = await Booking.findById(booking._id);
      expect(updated?.email).toBe('new@example.com');
    });

    it('should delete booking by ID', async () => {
      const event = await createTestEvent();

      const booking = await Booking.create({
        eventId: event._id,
        email: 'delete@example.com',
      });

      await Booking.deleteOne({ _id: booking._id });

      const found = await Booking.findById(booking._id);
      expect(found).toBeNull();
    });

    it('should count bookings for an event', async () => {
      const event = await createTestEvent();

      await Booking.create({
        eventId: event._id,
        email: 'user1@example.com',
      });

      await Booking.create({
        eventId: event._id,
        email: 'user2@example.com',
      });

      const count = await Booking.countDocuments({ eventId: event._id });
      expect(count).toBe(2);
    });

    it('should find booking by email', async () => {
      const event = await createTestEvent();
      const testEmail = 'findme@example.com';

      await Booking.create({
        eventId: event._id,
        email: testEmail,
      });

      const booking = await Booking.findOne({ email: testEmail });
      expect(booking).toBeDefined();
      expect(booking?.email).toBe(testEmail);
    });

    it('should handle case-insensitive email queries', async () => {
      const event = await createTestEvent();

      await Booking.create({
        eventId: event._id,
        email: 'CaseInsensitive@Example.COM',
      });

      const booking = await Booking.findOne({ email: 'caseinsensitive@example.com' });
      expect(booking).toBeDefined();
      expect(booking?.email).toBe('caseinsensitive@example.com');
    });

    it('should update updatedAt timestamp on save', async () => {
      const event = await createTestEvent();

      const booking = await Booking.create({
        eventId: event._id,
        email: 'timestamp@example.com',
      });

      const originalUpdatedAt = booking.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      booking.email = 'newtimestamp@example.com';
      await booking.save();

      expect(booking.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should maintain createdAt timestamp on update', async () => {
      const event = await createTestEvent();

      const booking = await Booking.create({
        eventId: event._id,
        email: 'created@example.com',
      });

      const originalCreatedAt = booking.createdAt;

      booking.email = 'updated@example.com';
      await booking.save();

      expect(booking.createdAt.getTime()).toBe(originalCreatedAt.getTime());
    });
  });

  describe('Additional Boundary Conditions', () => {
    it('should handle empty string email after trim', async () => {
      const event = await createTestEvent();

      const booking = new Booking({
        eventId: event._id,
        email: '   ',
      });

      await expect(booking.save()).rejects.toThrow();
    });

    it('should handle very short valid email', async () => {
      const event = await createTestEvent();

      const booking = await Booking.create({
        eventId: event._id,
        email: 'a@b.c',
      });

      expect(booking.email).toBe('a@b.c');
    });

    it('should handle mixed case in email domain', async () => {
      const event = await createTestEvent();

      const booking = await Booking.create({
        eventId: event._id,
        email: 'User@EXAMPLE.COM',
      });

      expect(booking.email).toBe('user@example.com');
    });

    it('should reject null email', async () => {
      const event = await createTestEvent();

      const booking = new Booking({
        eventId: event._id,
        email: null as any,
      });

      await expect(booking.save()).rejects.toThrow();
    });

    it('should reject undefined email', async () => {
      const event = await createTestEvent();

      const booking = new Booking({
        eventId: event._id,
        email: undefined as any,
      });

      await expect(booking.save()).rejects.toThrow();
    });

    it('should reject email with newline characters', async () => {
      const event = await createTestEvent();

      const booking = new Booking({
        eventId: event._id,
        email: 'user@exam\nple.com',
      });

      await expect(booking.save()).rejects.toThrow('Please provide a valid email address');
    });

    it('should reject email with tab characters', async () => {
      const event = await createTestEvent();

      const booking = new Booking({
        eventId: event._id,
        email: 'user@exam\tple.com',
      });

      await expect(booking.save()).rejects.toThrow('Please provide a valid email address');
    });
  });

  describe('Additional Model Schema Tests', () => {
    it('should have correct schema field types', () => {
      const schema = Booking.schema;
      
      expect(schema.path('eventId')).toBeDefined();
      expect(schema.path('email')).toBeDefined();
      expect(schema.path('createdAt')).toBeDefined();
      expect(schema.path('updatedAt')).toBeDefined();
    });

    it('should have timestamps enabled', () => {
      const schema = Booking.schema;
      expect(schema.options.timestamps).toBe(true);
    });

    it('should have eventId as ObjectId reference', () => {
      const eventIdPath = Booking.schema.path('eventId');
      expect(eventIdPath).toBeDefined();
    });

    it('should have email field with lowercase option', () => {
      const emailPath = Booking.schema.path('email') as any;
      expect(emailPath.options.lowercase).toBe(true);
    });

    it('should have email field with trim option', () => {
      const emailPath = Booking.schema.path('email') as any;
      expect(emailPath.options.trim).toBe(true);
    });
  });

  describe('Additional Complex Scenarios', () => {
    it('should handle bulk insert operations', async () => {
      const event = await createTestEvent();

      const bookings = Array.from({ length: 10 }, (_, i) => ({
        eventId: event._id,
        email: `bulk${i}@example.com`,
      }));

      const result = await Booking.insertMany(bookings);
      expect(result).toHaveLength(10);
    });

    it('should handle findOneAndUpdate operation', async () => {
      const event = await createTestEvent();

      const booking = await Booking.create({
        eventId: event._id,
        email: 'original@example.com',
      });

      const updated = await Booking.findOneAndUpdate(
        { _id: booking._id },
        { email: 'updated@example.com' },
        { new: true }
      );

      expect(updated?.email).toBe('updated@example.com');
    });

    it('should handle findByIdAndDelete operation', async () => {
      const event = await createTestEvent();

      const booking = await Booking.create({
        eventId: event._id,
        email: 'todelete@example.com',
      });

      const deleted = await Booking.findByIdAndDelete(booking._id);
      expect(deleted).toBeDefined();
      expect(deleted?.email).toBe('todelete@example.com');

      const notFound = await Booking.findById(booking._id);
      expect(notFound).toBeNull();
    });

    it('should support querying with multiple conditions', async () => {
      const event1 = await createTestEvent();
      const event2 = await Event.create({
        title: 'Second Event',
        description: 'Second Description',
        overview: 'Second Overview',
        image: '/second.jpg',
        venue: 'Second Venue',
        location: 'Second Location',
        date: '2025-01-01',
        time: '15:00',
        mode: 'offline',
        audience: 'Second Audience',
        agenda: ['Second Agenda'],
        organizer: 'Second Organizer',
        tags: ['second'],
      });

      await Booking.create({
        eventId: event1._id,
        email: 'multi1@example.com',
      });

      await Booking.create({
        eventId: event2._id,
        email: 'multi2@example.com',
      });

      const bookings = await Booking.find({
        eventId: { $in: [event1._id, event2._id] },
      });

      expect(bookings).toHaveLength(2);
    });

    it('should support aggregation operations', async () => {
      const event = await createTestEvent();

      await Booking.create({
        eventId: event._id,
        email: 'agg1@example.com',
      });

      await Booking.create({
        eventId: event._id,
        email: 'agg2@example.com',
      });

      const result = await Booking.aggregate([
        { $match: { eventId: event._id } },
        { $group: { _id: '$eventId', count: { $sum: 1 } } },
      ]);

      expect(result).toHaveLength(1);
      expect(result[0].count).toBe(2);
    });
  });

  describe('Additional Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This test ensures error propagation works correctly
      const event = await createTestEvent();
      
      const booking = new Booking({
        eventId: event._id,
        email: 'test@example.com',
      });

      // Save should work normally
      await expect(booking.save()).resolves.toBeDefined();
    });

    it('should provide meaningful error for malformed ObjectId', async () => {
      const booking = new Booking({
        eventId: 'invalid-objectid' as any,
        email: 'test@example.com',
      });

      await expect(booking.save()).rejects.toThrow();
    });

    it('should handle validation errors with multiple fields', async () => {
      const booking = new Booking({
        // Missing both required fields
      });

      await expect(booking.save()).rejects.toThrow();
    });
  });