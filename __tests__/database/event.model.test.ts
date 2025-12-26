import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Event, { IEvent } from '@/database/event.model';

let mongoServer: MongoMemoryServer;

describe('Event Model', () => {
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
    await Event.deleteMany({});
  });

  describe('Model Creation', () => {
    it('should create a valid event with all required fields', async () => {
      const eventData = {
        title: 'Tech Conference 2024',
        description: 'Annual tech conference',
        overview: 'A comprehensive overview of latest tech trends',
        image: 'https://example.com/image.jpg',
        venue: 'Convention Center',
        location: 'San Francisco, CA',
        date: '2024-06-15',
        time: '09:00',
        mode: 'hybrid',
        audience: 'Developers and Tech Enthusiasts',
        agenda: ['Registration', 'Keynote', 'Workshops', 'Networking'],
        organizer: 'Tech Events Inc',
        tags: ['technology', 'conference', 'networking'],
      };

      const event = new Event(eventData);
      const savedEvent = await event.save();

      expect(savedEvent._id).toBeDefined();
      expect(savedEvent.title).toBe(eventData.title);
      expect(savedEvent.description).toBe(eventData.description);
      expect(savedEvent.slug).toBe('tech-conference-2024');
      expect(savedEvent.createdAt).toBeDefined();
      expect(savedEvent.updatedAt).toBeDefined();
    });

    it('should create event with minimal required fields', async () => {
      const minimalEvent = {
        title: 'Minimal Event',
        description: 'Minimal description',
        overview: 'Minimal overview',
        image: '/image.png',
        venue: 'Online',
        location: 'Virtual',
        date: '2024-12-31',
        time: '14:30',
        mode: 'online',
        audience: 'General',
        agenda: ['Main session'],
        organizer: 'Organizer Name',
        tags: ['event'],
      };

      const event = await Event.create(minimalEvent);
      expect(event._id).toBeDefined();
      expect(event.title).toBe('Minimal Event');
    });
  });

  describe('Slug Generation', () => {
    it('should generate lowercase slug from title', async () => {
      const event = await Event.create({
        title: 'JavaScript Workshop 2024',
        description: 'Workshop on JS',
        overview: 'Learn JavaScript',
        image: '/img.jpg',
        venue: 'Tech Hub',
        location: 'NYC',
        date: '2024-07-20',
        time: '10:00',
        mode: 'offline',
        audience: 'Developers',
        agenda: ['Intro'],
        organizer: 'JS Group',
        tags: ['javascript'],
      });

      expect(event.slug).toBe('javascript-workshop-2024');
    });

    it('should replace spaces with hyphens in slug', async () => {
      const event = await Event.create({
        title: 'React Native Mobile Development',
        description: 'Mobile dev workshop',
        overview: 'Learn React Native',
        image: '/img.jpg',
        venue: 'Dev Center',
        location: 'LA',
        date: '2024-08-10',
        time: '11:00',
        mode: 'online',
        audience: 'Mobile Developers',
        agenda: ['Setup', 'Build App'],
        organizer: 'Mobile Dev Team',
        tags: ['react', 'mobile'],
      });

      expect(event.slug).toBe('react-native-mobile-development');
    });

    it('should remove special characters from slug', async () => {
      const event = await Event.create({
        title: 'C++ & Python: Advanced Programming!',
        description: 'Programming workshop',
        overview: 'Advanced topics',
        image: '/img.jpg',
        venue: 'Code Academy',
        location: 'Boston',
        date: '2024-09-05',
        time: '13:00',
        mode: 'hybrid',
        audience: 'Advanced Programmers',
        agenda: ['C++ Session', 'Python Session'],
        organizer: 'Code Masters',
        tags: ['cpp', 'python'],
      });

      expect(event.slug).toBe('c-python-advanced-programming');
    });

    it('should collapse multiple hyphens into single hyphen', async () => {
      const event = await Event.create({
        title: 'Event   With    Multiple     Spaces',
        description: 'Test event',
        overview: 'Testing slug generation',
        image: '/img.jpg',
        venue: 'Test Venue',
        location: 'Test City',
        date: '2024-10-15',
        time: '15:00',
        mode: 'online',
        audience: 'Testers',
        agenda: ['Test'],
        organizer: 'Test Org',
        tags: ['test'],
      });

      expect(event.slug).toBe('event-with-multiple-spaces');
    });

    it('should regenerate slug when title is modified', async () => {
      const event = await Event.create({
        title: 'Original Title',
        description: 'Description',
        overview: 'Overview',
        image: '/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: '2024-12-01',
        time: '17:00',
        mode: 'online',
        audience: 'Everyone',
        agenda: ['Item'],
        organizer: 'Org',
        tags: ['tag'],
      });

      expect(event.slug).toBe('original-title');

      event.title = 'Updated Title';
      await event.save();

      expect(event.slug).toBe('updated-title');
    });
  });

  describe('Date Normalization', () => {
    it('should normalize ISO date string to YYYY-MM-DD format', async () => {
      const event = await Event.create({
        title: 'Date Test Event',
        description: 'Testing date',
        overview: 'Date normalization',
        image: '/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: '2024-06-15T10:30:00.000Z',
        time: '10:00',
        mode: 'online',
        audience: 'All',
        agenda: ['Session'],
        organizer: 'Org',
        tags: ['test'],
      });

      expect(event.date).toBe('2024-06-15');
    });

    it('should reject invalid date format', async () => {
      const invalidEvent = new Event({
        title: 'Invalid Date Event',
        description: 'Invalid date',
        overview: 'Testing invalid date',
        image: '/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: 'not-a-valid-date',
        time: '10:00',
        mode: 'online',
        audience: 'All',
        agenda: ['Session'],
        organizer: 'Org',
        tags: ['test'],
      });

      await expect(invalidEvent.save()).rejects.toThrow('Date must be a valid date string');
    });
  });

  describe('Time Normalization', () => {
    it('should normalize time to HH:MM 24-hour format', async () => {
      const event = await Event.create({
        title: 'Time Test',
        description: 'Testing time',
        overview: 'Time normalization',
        image: '/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: '2024-07-01',
        time: '9:30',
        mode: 'online',
        audience: 'All',
        agenda: ['Session'],
        organizer: 'Org',
        tags: ['test'],
      });

      expect(event.time).toBe('09:30');
    });

    it('should convert 12-hour AM format to 24-hour format', async () => {
      const event = await Event.create({
        title: 'AM Time Test',
        description: 'Testing AM time',
        overview: 'AM conversion',
        image: '/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: '2024-07-15',
        time: '9:45 AM',
        mode: 'offline',
        audience: 'All',
        agenda: ['Session'],
        organizer: 'Org',
        tags: ['test'],
      });

      expect(event.time).toBe('09:45');
    });

    it('should convert 12-hour PM format to 24-hour format', async () => {
      const event = await Event.create({
        title: 'PM Time Test',
        description: 'Testing PM time',
        overview: 'PM conversion',
        image: '/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: '2024-08-01',
        time: '3:15 PM',
        mode: 'hybrid',
        audience: 'All',
        agenda: ['Session'],
        organizer: 'Org',
        tags: ['test'],
      });

      expect(event.time).toBe('15:15');
    });

    it('should handle 12:00 AM (midnight) correctly', async () => {
      const event = await Event.create({
        title: 'Midnight Event',
        description: 'Midnight test',
        overview: 'Testing midnight',
        image: '/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: '2024-09-01',
        time: '12:00 AM',
        mode: 'online',
        audience: 'Night owls',
        agenda: ['Late session'],
        organizer: 'Org',
        tags: ['midnight'],
      });

      expect(event.time).toBe('00:00');
    });

    it('should handle 12:00 PM (noon) correctly', async () => {
      const event = await Event.create({
        title: 'Noon Event',
        description: 'Noon test',
        overview: 'Testing noon',
        image: '/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: '2024-10-01',
        time: '12:30 PM',
        mode: 'offline',
        audience: 'Lunch attendees',
        agenda: ['Lunch session'],
        organizer: 'Org',
        tags: ['noon'],
      });

      expect(event.time).toBe('12:30');
    });

    it('should reject invalid time format', async () => {
      const invalidEvent = new Event({
        title: 'Invalid Time',
        description: 'Invalid time test',
        overview: 'Testing invalid time',
        image: '/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: '2024-11-01',
        time: '25:00',
        mode: 'online',
        audience: 'All',
        agenda: ['Session'],
        organizer: 'Org',
        tags: ['test'],
      });

      await expect(invalidEvent.save()).rejects.toThrow('Time must be in HH:MM or HH:MM AM/PM format');
    });
  });

  describe('Field Validation', () => {
    it('should require title', async () => {
      const event = new Event({
        description: 'Description',
        overview: 'Overview',
        image: '/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: '2024-06-01',
        time: '10:00',
        mode: 'online',
        audience: 'All',
        agenda: ['Session'],
        organizer: 'Org',
        tags: ['test'],
      });

      await expect(event.save()).rejects.toThrow();
    });

    it('should enforce mode enum values', async () => {
      const invalidEvent = new Event({
        title: 'Invalid Mode Event',
        description: 'Testing mode validation',
        overview: 'Mode validation test',
        image: '/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: '2024-08-01',
        time: '10:00',
        mode: 'invalid-mode',
        audience: 'All',
        agenda: ['Session'],
        organizer: 'Org',
        tags: ['test'],
      });

      await expect(invalidEvent.save()).rejects.toThrow();
    });

    it('should require at least one agenda item', async () => {
      const event = new Event({
        title: 'Empty Agenda Event',
        description: 'Testing agenda validation',
        overview: 'Agenda validation test',
        image: '/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: '2024-12-01',
        time: '10:00',
        mode: 'online',
        audience: 'All',
        agenda: [],
        organizer: 'Org',
        tags: ['test'],
      });

      await expect(event.save()).rejects.toThrow('Agenda must contain at least one item');
    });

    it('should require at least one tag', async () => {
      const event = new Event({
        title: 'No Tags Event',
        description: 'Testing tags validation',
        overview: 'Tags validation test',
        image: '/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: '2024-12-15',
        time: '10:00',
        mode: 'online',
        audience: 'All',
        agenda: ['Session'],
        organizer: 'Org',
        tags: [],
      });

      await expect(event.save()).rejects.toThrow('Tags must contain at least one item');
    });
  });

  describe('Timestamps', () => {
    it('should automatically set createdAt and updatedAt', async () => {
      const event = await Event.create({
        title: 'Timestamp Test',
        description: 'Testing timestamps',
        overview: 'Timestamp functionality',
        image: '/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: '2024-08-01',
        time: '10:00',
        mode: 'online',
        audience: 'All',
        agenda: ['Session'],
        organizer: 'Org',
        tags: ['test'],
      });

      expect(event.createdAt).toBeInstanceOf(Date);
      expect(event.updatedAt).toBeInstanceOf(Date);
    });
  });
});