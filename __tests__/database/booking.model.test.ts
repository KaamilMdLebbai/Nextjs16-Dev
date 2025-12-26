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