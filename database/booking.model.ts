import mongoose, { Document, Model, Schema, Types } from 'mongoose';

/**
 * TypeScript interface for Booking document
 * Extends Mongoose Document to include all model fields with proper types
 */
export interface IBooking extends Document {
  eventId: Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      validate: {
        validator: function (email: string): boolean {
          // RFC 5322 compliant email validation regex
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(email);
        },
        message: 'Please provide a valid email address',
      },
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt
  }
);

/**
 * Pre-save hook: Validate that the referenced Event exists
 * Prevents orphaned bookings by checking event existence before saving
 */
bookingSchema.pre('save', async function (next) {
  // Only validate eventId if it's new or modified
  if (this.isNew || this.isModified('eventId')) {
    try {
      // Dynamically import Event model to avoid circular dependency issues
      const Event = mongoose.model('Event');
      
      // Check if the event exists in the database
      const eventExists = await Event.exists({ _id: this.eventId });
      
      if (!eventExists) {
        return next(
          new Error(`Event with ID ${this.eventId} does not exist`)
        );
      }
    } catch (error) {
      // Handle case where Event model might not be registered yet
      if (error instanceof Error && error.message.includes('Schema hasn\'t been registered')) {
        return next(
          new Error('Event model must be registered before creating bookings')
        );
      }
      return next(error as Error);
    }
  }

  next();
});

// Create index on eventId for faster queries and better performance
bookingSchema.index({ eventId: 1 });

// Optional: Create compound index for unique bookings per event
// Uncomment if you want to prevent duplicate bookings by the same email for the same event
// bookingSchema.index({ eventId: 1, email: 1 }, { unique: true });

// Prevent model overwrite during hot reloads in development
const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>('Booking', bookingSchema);

export default Booking;
