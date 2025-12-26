import * as DatabaseExports from '@/database';
import Event from '@/database/event.model';
import Booking from '@/database/booking.model';

describe('Database Index Exports', () => {
  describe('Model Exports', () => {
    it('should export Event model', () => {
      expect(DatabaseExports.Event).toBeDefined();
      expect(DatabaseExports.Event).toBe(Event);
    });

    it('should export Booking model', () => {
      expect(DatabaseExports.Booking).toBeDefined();
      expect(DatabaseExports.Booking).toBe(Booking);
    });

    it('should have all expected named exports', () => {
      expect(DatabaseExports).toHaveProperty('Event');
      expect(DatabaseExports).toHaveProperty('Booking');
    });
  });

  describe('Type Exports', () => {
    it('should allow importing IEvent type', () => {
      type IEvent = DatabaseExports.IEvent;
      
      const mockEvent: Partial<IEvent> = {
        title: 'Test Event',
        slug: 'test-event',
        description: 'Test Description',
      };

      expect(mockEvent.title).toBe('Test Event');
    });

    it('should allow importing IBooking type', () => {
      type IBooking = DatabaseExports.IBooking;
      
      const mockBooking: Partial<IBooking> = {
        email: 'test@example.com',
      };

      expect(mockBooking.email).toBe('test@example.com');
    });
  });

  describe('Import Consistency', () => {
    it('should allow destructured imports', () => {
      const { Event: EventModel, Booking: BookingModel } = DatabaseExports;
      
      expect(EventModel).toBeDefined();
      expect(BookingModel).toBeDefined();
    });
  });
});