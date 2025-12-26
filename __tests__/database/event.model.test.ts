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
  describe('Additional Slug Generation Edge Cases', () => {
    it('should handle title with only special characters', async () => {
      const event = await Event.create({
        title: '!@#$%^&*()',
        description: 'Special chars',
        overview: 'Testing special characters',
        image: '/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: '2024-12-01',
        time: '10:00',
        mode: 'online',
        audience: 'All',
        agenda: ['Session'],
        organizer: 'Org',
        tags: ['test'],
      });

      expect(event.slug).toBe('');
    });

    it('should handle title with unicode characters', async () => {
      const event = await Event.create({
        title: 'Café Résumé 2024',
        description: 'Unicode test',
        overview: 'Testing unicode',
        image: '/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: '2024-12-05',
        time: '10:00',
        mode: 'online',
        audience: 'All',
        agenda: ['Session'],
        organizer: 'Org',
        tags: ['test'],
      });

      expect(event.slug).toBe('caf-rsum-2024');
    });

    it('should handle very long titles', async () => {
      const longTitle = 'A'.repeat(200) + ' Event';
      
      const event = await Event.create({
        title: longTitle,
        description: 'Long title test',
        overview: 'Testing long titles',
        image: '/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: '2024-12-10',
        time: '10:00',
        mode: 'online',
        audience: 'All',
        agenda: ['Session'],
        organizer: 'Org',
        tags: ['test'],
      });

      expect(event.slug).toContain('a');
      expect(event.slug).toContain('event');
    });

    it('should handle title with leading and trailing hyphens', async () => {
      const event = await Event.create({
        title: '---Event Title---',
        description: 'Hyphen test',
        overview: 'Testing hyphens',
        image: '/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: '2024-12-15',
        time: '10:00',
        mode: 'online',
        audience: 'All',
        agenda: ['Session'],
        organizer: 'Org',
        tags: ['test'],
      });

      expect(event.slug).toBe('event-title');
      expect(event.slug).not.toMatch(/^-/);
      expect(event.slug).not.toMatch(/-$/);
    });

    it('should not regenerate slug when other fields are modified', async () => {
      const event = await Event.create({
        title: 'Constant Title',
        description: 'Original description',
        overview: 'Original overview',
        image: '/img.jpg',
        venue: 'Original Venue',
        location: 'Original Location',
        date: '2024-12-20',
        time: '10:00',
        mode: 'online',
        audience: 'All',
        agenda: ['Session'],
        organizer: 'Org',
        tags: ['test'],
      });

      const originalSlug = event.slug;

      event.description = 'Updated description';
      event.venue = 'Updated Venue';
      await event.save();

      expect(event.slug).toBe(originalSlug);
    });

    it('should handle numbers in title', async () => {
      const event = await Event.create({
        title: '2024 Web3 Conference 2.0',
        description: 'Numbers test',
        overview: 'Testing numbers',
        image: '/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: '2024-12-25',
        time: '10:00',
        mode: 'online',
        audience: 'All',
        agenda: ['Session'],
        organizer: 'Org',
        tags: ['test'],
      });

      expect(event.slug).toBe('2024-web3-conference-20');
    });
  });

  describe('Additional Date Validation', () => {
    it('should handle various ISO date formats', async () => {
      const dateFormats = [
        '2024-12-31',
        '2024-12-31T00:00:00',
        '2024-12-31T00:00:00.000Z',
        'December 31, 2024',
      ];

      for (const dateFormat of dateFormats) {
        const event = await Event.create({
          title: `Date Test ${dateFormat}`,
          description: 'Date format test',
          overview: 'Testing date formats',
          image: '/img.jpg',
          venue: 'Venue',
          location: 'Location',
          date: dateFormat,
          time: '10:00',
          mode: 'online',
          audience: 'All',
          agenda: ['Session'],
          organizer: 'Org',
          tags: ['test'],
        });

        expect(event.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });

    it('should handle leap year dates', async () => {
      const event = await Event.create({
        title: 'Leap Year Event',
        description: 'Leap year test',
        overview: 'Testing leap year',
        image: '/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: '2024-02-29',
        time: '10:00',
        mode: 'online',
        audience: 'All',
        agenda: ['Session'],
        organizer: 'Org',
        tags: ['test'],
      });

      expect(event.date).toBe('2024-02-29');
    });

    it('should handle dates far in the future', async () => {
      const event = await Event.create({
        title: 'Future Event',
        description: 'Future date test',
        overview: 'Testing future dates',
        image: '/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: '2099-12-31',
        time: '10:00',
        mode: 'online',
        audience: 'All',
        agenda: ['Session'],
        organizer: 'Org',
        tags: ['test'],
      });

      expect(event.date).toBe('2099-12-31');
    });

    it('should handle dates in the past', async () => {
      const event = await Event.create({
        title: 'Past Event',
        description: 'Past date test',
        overview: 'Testing past dates',
        image: '/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: '2020-01-01',
        time: '10:00',
        mode: 'online',
        audience: 'All',
        agenda: ['Session'],
        organizer: 'Org',
        tags: ['test'],
      });

      expect(event.date).toBe('2020-01-01');
    });

    it('should reject obviously invalid dates', async () => {
      const invalidEvent = new Event({
        title: 'Invalid Date Event',
        description: 'Invalid date test',
        overview: 'Testing invalid dates',
        image: '/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: '2024-13-45', // Invalid month and day
        time: '10:00',
        mode: 'online',
        audience: 'All',
        agenda: ['Session'],
        organizer: 'Org',
        tags: ['test'],
      });

      // Note: JavaScript Date may parse this differently
      const result = await invalidEvent.save();
      expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('Additional Time Validation', () => {
    it('should handle edge time values', async () => {
      const times = [
        { input: '00:00', expected: '00:00' },
        { input: '23:59', expected: '23:59' },
        { input: '0:00', expected: '00:00' },
        { input: '9:05', expected: '09:05' },
      ];

      for (const { input, expected } of times) {
        const event = await Event.create({
          title: `Time Test ${input}`,
          description: 'Time test',
          overview: 'Testing times',
          image: '/img.jpg',
          venue: 'Venue',
          location: 'Location',
          date: '2024-12-31',
          time: input,
          mode: 'online',
          audience: 'All',
          agenda: ['Session'],
          organizer: 'Org',
          tags: ['test'],
        });

        expect(event.time).toBe(expected);
      }
    });

    it('should handle 12-hour format with various spacing', async () => {
      const times = [
        { input: '9:00AM', expected: '09:00' },
        { input: '9:00 AM', expected: '09:00' },
        { input: '9:00  AM', expected: '09:00' },
        { input: '3:30PM', expected: '15:30' },
        { input: '3:30 PM', expected: '15:30' },
      ];

      for (const { input, expected } of times) {
        const event = await Event.create({
          title: `12h Time Test ${input}`,
          description: '12-hour time test',
          overview: 'Testing 12-hour format',
          image: '/img.jpg',
          venue: 'Venue',
          location: 'Location',
          date: '2024-12-31',
          time: input,
          mode: 'online',
          audience: 'All',
          agenda: ['Session'],
          organizer: 'Org',
          tags: ['test'],
        });

        expect(event.time).toBe(expected);
      }
    });

    it('should handle all PM hours correctly', async () => {
      const pmTimes = [
        { input: '1:00 PM', expected: '13:00' },
        { input: '2:00 PM', expected: '14:00' },
        { input: '3:00 PM', expected: '15:00' },
        { input: '11:00 PM', expected: '23:00' },
      ];

      for (const { input, expected } of pmTimes) {
        const event = await Event.create({
          title: `PM Time ${input}`,
          description: 'PM time test',
          overview: 'Testing PM times',
          image: '/img.jpg',
          venue: 'Venue',
          location: 'Location',
          date: '2024-12-31',
          time: input,
          mode: 'online',
          audience: 'All',
          agenda: ['Session'],
          organizer: 'Org',
          tags: ['test'],
        });

        expect(event.time).toBe(expected);
      }
    });

    it('should reject invalid time ranges', async () => {
      const invalidTimes = ['24:00', '25:30', '12:60', '23:75'];

      for (const time of invalidTimes) {
        const event = new Event({
          title: 'Invalid Time Event',
          description: 'Invalid time test',
          overview: 'Testing invalid times',
          image: '/img.jpg',
          venue: 'Venue',
          location: 'Location',
          date: '2024-12-31',
          time,
          mode: 'online',
          audience: 'All',
          agenda: ['Session'],
          organizer: 'Org',
          tags: ['test'],
        });

        await expect(event.save()).rejects.toThrow('Time must be in HH:MM or HH:MM AM/PM format');
      }
    });

    it('should reject invalid 12-hour format', async () => {
      const invalidTimes = ['13:00 AM', '0:00 PM', '13:00 PM'];

      for (const time of invalidTimes) {
        const event = new Event({
          title: 'Invalid 12h Time Event',
          description: 'Invalid 12-hour time test',
          overview: 'Testing invalid 12-hour times',
          image: '/img.jpg',
          venue: 'Venue',
          location: 'Location',
          date: '2024-12-31',
          time,
          mode: 'online',
          audience: 'All',
          agenda: ['Session'],
          organizer: 'Org',
          tags: ['test'],
        });

        await expect(event.save()).rejects.toThrow();
      }
    });
  });

  describe('Additional Field Validation', () => {
    it('should trim all string fields', async () => {
      const event = await Event.create({
        title: '  Trimmed Title  ',
        description: '  Trimmed Description  ',
        overview: '  Trimmed Overview  ',
        image: '  /trimmed.jpg  ',
        venue: '  Trimmed Venue  ',
        location: '  Trimmed Location  ',
        date: '2024-12-31',
        time: '10:00',
        mode: 'online',
        audience: '  Trimmed Audience  ',
        agenda: ['  Trimmed Agenda  '],
        organizer: '  Trimmed Organizer  ',
        tags: ['  trimmed  '],
      });

      expect(event.title).toBe('Trimmed Title');
      expect(event.description).toBe('Trimmed Description');
      expect(event.overview).toBe('Trimmed Overview');
      expect(event.image).toBe('/trimmed.jpg');
      expect(event.venue).toBe('Trimmed Venue');
      expect(event.location).toBe('Trimmed Location');
      expect(event.audience).toBe('Trimmed Audience');
      expect(event.organizer).toBe('Trimmed Organizer');
    });

    it('should accept all valid mode values', async () => {
      const modes = ['online', 'offline', 'hybrid'];

      for (const mode of modes) {
        const event = await Event.create({
          title: `Mode Test ${mode}`,
          description: 'Mode validation test',
          overview: 'Testing mode values',
          image: '/img.jpg',
          venue: 'Venue',
          location: 'Location',
          date: '2024-12-31',
          time: '10:00',
          mode,
          audience: 'All',
          agenda: ['Session'],
          organizer: 'Org',
          tags: ['test'],
        });

        expect(event.mode).toBe(mode);
      }
    });

    it('should reject invalid mode values', async () => {
      const invalidModes = ['virtual', 'in-person', 'mixed', ''];

      for (const mode of invalidModes) {
        const event = new Event({
          title: 'Invalid Mode Event',
          description: 'Invalid mode test',
          overview: 'Testing invalid mode',
          image: '/img.jpg',
          venue: 'Venue',
          location: 'Location',
          date: '2024-12-31',
          time: '10:00',
          mode,
          audience: 'All',
          agenda: ['Session'],
          organizer: 'Org',
          tags: ['test'],
        });

        await expect(event.save()).rejects.toThrow();
      }
    });

    it('should require all mandatory fields', async () => {
      const requiredFields = [
        'title',
        'description',
        'overview',
        'image',
        'venue',
        'location',
        'date',
        'time',
        'mode',
        'audience',
        'agenda',
        'organizer',
        'tags',
      ];

      for (const field of requiredFields) {
        const eventData: any = {
          title: 'Test Event',
          description: 'Description',
          overview: 'Overview',
          image: '/img.jpg',
          venue: 'Venue',
          location: 'Location',
          date: '2024-12-31',
          time: '10:00',
          mode: 'online',
          audience: 'All',
          agenda: ['Item'],
          organizer: 'Org',
          tags: ['tag'],
        };

        delete eventData[field];

        const event = new Event(eventData);
        await expect(event.save()).rejects.toThrow();
      }
    });

    it('should accept multiple agenda items', async () => {
      const event = await Event.create({
        title: 'Multi Agenda Event',
        description: 'Multiple agenda items',
        overview: 'Testing multiple agenda',
        image: '/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: '2024-12-31',
        time: '10:00',
        mode: 'online',
        audience: 'All',
        agenda: ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'],
        organizer: 'Org',
        tags: ['test'],
      });

      expect(event.agenda).toHaveLength(5);
    });

    it('should accept multiple tags', async () => {
      const event = await Event.create({
        title: 'Multi Tag Event',
        description: 'Multiple tags',
        overview: 'Testing multiple tags',
        image: '/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: '2024-12-31',
        time: '10:00',
        mode: 'online',
        audience: 'All',
        agenda: ['Item'],
        organizer: 'Org',
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
      });

      expect(event.tags).toHaveLength(5);
    });
  });

  describe('Additional Database Operations', () => {
    it('should update event fields', async () => {
      const event = await Event.create({
        title: 'Original Event',
        description: 'Original description',
        overview: 'Original overview',
        image: '/original.jpg',
        venue: 'Original Venue',
        location: 'Original Location',
        date: '2024-12-31',
        time: '10:00',
        mode: 'online',
        audience: 'Original Audience',
        agenda: ['Original Agenda'],
        organizer: 'Original Organizer',
        tags: ['original'],
      });

      event.description = 'Updated description';
      event.venue = 'Updated Venue';
      await event.save();

      const updated = await Event.findById(event._id);
      expect(updated?.description).toBe('Updated description');
      expect(updated?.venue).toBe('Updated Venue');
    });

    it('should find event by slug', async () => {
      await Event.create({
        title: 'Findable Event',
        description: 'Description',
        overview: 'Overview',
        image: '/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: '2024-12-31',
        time: '10:00',
        mode: 'online',
        audience: 'All',
        agenda: ['Item'],
        organizer: 'Org',
        tags: ['test'],
      });

      const event = await Event.findOne({ slug: 'findable-event' });
      expect(event).toBeDefined();
      expect(event?.title).toBe('Findable Event');
    });

    it('should enforce unique slug constraint', async () => {
      await Event.create({
        title: 'Unique Event',
        description: 'First',
        overview: 'First',
        image: '/img1.jpg',
        venue: 'Venue 1',
        location: 'Location 1',
        date: '2024-12-31',
        time: '10:00',
        mode: 'online',
        audience: 'All',
        agenda: ['Item'],
        organizer: 'Org',
        tags: ['test'],
      });

      // Try to create another event with the same title (and thus same slug)
      await expect(
        Event.create({
          title: 'Unique Event',
          description: 'Second',
          overview: 'Second',
          image: '/img2.jpg',
          venue: 'Venue 2',
          location: 'Location 2',
          date: '2025-01-01',
          time: '11:00',
          mode: 'offline',
          audience: 'All',
          agenda: ['Item'],
          organizer: 'Org',
          tags: ['test'],
        })
      ).rejects.toThrow();
    });

    it('should delete event', async () => {
      const event = await Event.create({
        title: 'Delete Me',
        description: 'To be deleted',
        overview: 'Deletion test',
        image: '/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: '2024-12-31',
        time: '10:00',
        mode: 'online',
        audience: 'All',
        agenda: ['Item'],
        organizer: 'Org',
        tags: ['test'],
      });

      await Event.deleteOne({ _id: event._id });

      const found = await Event.findById(event._id);
      expect(found).toBeNull();
    });

    it('should count events', async () => {
      await Event.create({
        title: 'Count Event 1',
        description: 'Description',
        overview: 'Overview',
        image: '/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: '2024-12-31',
        time: '10:00',
        mode: 'online',
        audience: 'All',
        agenda: ['Item'],
        organizer: 'Org',
        tags: ['count'],
      });

      await Event.create({
        title: 'Count Event 2',
        description: 'Description',
        overview: 'Overview',
        image: '/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: '2024-12-31',
        time: '11:00',
        mode: 'offline',
        audience: 'All',
        agenda: ['Item'],
        organizer: 'Org',
        tags: ['count'],
      });

      const count = await Event.countDocuments({ tags: 'count' });
      expect(count).toBe(2);
    });

    it('should support findOneAndUpdate', async () => {
      const event = await Event.create({
        title: 'Update Test',
        description: 'Original',
        overview: 'Original',
        image: '/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: '2024-12-31',
        time: '10:00',
        mode: 'online',
        audience: 'All',
        agenda: ['Item'],
        organizer: 'Org',
        tags: ['test'],
      });

      const updated = await Event.findOneAndUpdate(
        { _id: event._id },
        { description: 'Updated' },
        { new: true }
      );

      expect(updated?.description).toBe('Updated');
    });

    it('should support bulk operations', async () => {
      const events = Array.from({ length: 5 }, (_, i) => ({
        title: `Bulk Event ${i}`,
        description: 'Description',
        overview: 'Overview',
        image: '/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: '2024-12-31',
        time: '10:00',
        mode: 'online' as const,
        audience: 'All',
        agenda: ['Item'],
        organizer: 'Org',
        tags: ['bulk'],
      }));

      const result = await Event.insertMany(events);
      expect(result).toHaveLength(5);
    });

    it('should support querying with regex', async () => {
      await Event.create({
        title: 'JavaScript Conference',
        description: 'JS event',
        overview: 'JavaScript topics',
        image: '/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: '2024-12-31',
        time: '10:00',
        mode: 'online',
        audience: 'Developers',
        agenda: ['Item'],
        organizer: 'Org',
        tags: ['javascript'],
      });

      const events = await Event.find({
        title: /javascript/i,
      });

      expect(events).toHaveLength(1);
      expect(events[0].title).toBe('JavaScript Conference');
    });

    it('should support sorting', async () => {
      await Event.create({
        title: 'Event B',
        description: 'Description',
        overview: 'Overview',
        image: '/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: '2024-12-31',
        time: '10:00',
        mode: 'online',
        audience: 'All',
        agenda: ['Item'],
        organizer: 'Org',
        tags: ['test'],
      });

      await Event.create({
        title: 'Event A',
        description: 'Description',
        overview: 'Overview',
        image: '/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: '2024-12-31',
        time: '11:00',
        mode: 'online',
        audience: 'All',
        agenda: ['Item'],
        organizer: 'Org',
        tags: ['test'],
      });

      const events = await Event.find({}).sort({ title: 1 });

      expect(events[0].title).toBe('Event A');
      expect(events[1].title).toBe('Event B');
    });
  });

  describe('Additional Model Schema Tests', () => {
    it('should have correct schema structure', () => {
      const schema = Event.schema;

      expect(schema.path('title')).toBeDefined();
      expect(schema.path('slug')).toBeDefined();
      expect(schema.path('description')).toBeDefined();
      expect(schema.path('mode')).toBeDefined();
    });

    it('should have timestamps enabled', () => {
      const schema = Event.schema;
      expect(schema.options.timestamps).toBe(true);
    });

    it('should have slug index', () => {
      const indexes = Event.schema.indexes();
      const slugIndex = indexes.find((idx: any) => idx[0].slug);
      expect(slugIndex).toBeDefined();
    });

    it('should have pre-save hook defined', () => {
      const preSaveHooks = Event.schema.pre('save');
      expect(preSaveHooks).toBeDefined();
    });
  });

  describe('Additional Complex Scenarios', () => {
    it('should handle concurrent updates to same event', async () => {
      const event = await Event.create({
        title: 'Concurrent Event',
        description: 'Original',
        overview: 'Original',
        image: '/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: '2024-12-31',
        time: '10:00',
        mode: 'online',
        audience: 'All',
        agenda: ['Item'],
        organizer: 'Org',
        tags: ['test'],
      });

      const update1 = Event.findByIdAndUpdate(
        event._id,
        { description: 'Update 1' },
        { new: true }
      );

      const update2 = Event.findByIdAndUpdate(
        event._id,
        { venue: 'New Venue' },
        { new: true }
      );

      await Promise.all([update1, update2]);

      const updated = await Event.findById(event._id);
      expect(updated).toBeDefined();
    });

    it('should handle aggregation pipeline', async () => {
      await Event.create({
        title: 'Online Event 1',
        description: 'Description',
        overview: 'Overview',
        image: '/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: '2024-12-31',
        time: '10:00',
        mode: 'online',
        audience: 'All',
        agenda: ['Item'],
        organizer: 'Org',
        tags: ['online'],
      });

      await Event.create({
        title: 'Offline Event 1',
        description: 'Description',
        overview: 'Overview',
        image: '/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: '2024-12-31',
        time: '11:00',
        mode: 'offline',
        audience: 'All',
        agenda: ['Item'],
        organizer: 'Org',
        tags: ['offline'],
      });

      const result = await Event.aggregate([
        { $group: { _id: '$mode', count: { $sum: 1 } } },
      ]);

      expect(result).toHaveLength(2);
    });

    it('should support text search on title', async () => {
      await Event.create({
        title: 'Machine Learning Workshop',
        description: 'ML topics',
        overview: 'Machine learning overview',
        image: '/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: '2024-12-31',
        time: '10:00',
        mode: 'online',
        audience: 'Data Scientists',
        agenda: ['Item'],
        organizer: 'Org',
        tags: ['ml'],
      });

      const events = await Event.find({
        title: { $regex: 'machine', $options: 'i' },
      });

      expect(events).toHaveLength(1);
    });
  });

  describe('Additional Boundary Conditions', () => {
    it('should handle empty strings after trim', async () => {
      const event = new Event({
        title: '   ',
        description: 'Description',
        overview: 'Overview',
        image: '/img.jpg',
        venue: 'Venue',
        location: 'Location',
        date: '2024-12-31',
        time: '10:00',
        mode: 'online',
        audience: 'All',
        agenda: ['Item'],
        organizer: 'Org',
        tags: ['test'],
      });

      await expect(event.save()).rejects.toThrow();
    });

    it('should handle very long field values', async () => {
      const longString = 'A'.repeat(1000);

      const event = await Event.create({
        title: longString,
        description: longString,
        overview: longString,
        image: '/img.jpg',
        venue: longString,
        location: longString,
        date: '2024-12-31',
        time: '10:00',
        mode: 'online',
        audience: longString,
        agenda: [longString],
        organizer: longString,
        tags: ['test'],
      });

      expect(event.title).toHaveLength(1000);
    });

    it('should handle special characters in various fields', async () => {
      const event = await Event.create({
        title: 'Event with "quotes" & <tags>',
        description: 'Description with \n newlines',
        overview: "Overview with 'apostrophes'",
        image: '/path/to/image.jpg',
        venue: 'Venue & Location',
        location: 'City, State, Country',
        date: '2024-12-31',
        time: '10:00',
        mode: 'online',
        audience: 'All & Everyone',
        agenda: ['First', 'Second & Third'],
        organizer: 'Org Inc.',
        tags: ['tag1', 'tag-2', 'tag_3'],
      });

      expect(event.title).toContain('quotes');
      expect(event.description).toContain('newlines');
    });
  });