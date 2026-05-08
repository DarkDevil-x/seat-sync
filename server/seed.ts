/**
 * seed.ts – Populate the database with an admin user and sample events.
 *
 * Usage (from project root):
 *   npx ts-node --project tsconfig.server.json server/seed.ts
 *
 * Re-running is idempotent: existing admin / seeded events are deleted first.
 */

import 'dotenv/config';
import dbConnect from './db';
import User from './models/User';
import EventModel from './models/Event';
import SeatModel from './models/Seat';
import BookingModel from './models/Booking';

async function seed() {
  console.log('🌱  Connecting to MongoDB…');
  await dbConnect();
  console.log('✅  Connected.');

  // ── Wipe existing seed data ──────────────────────────────────────────────
  await BookingModel.deleteMany({});
  await SeatModel.deleteMany({});
  await EventModel.deleteMany({});
  await User.deleteMany({});
  console.log('🗑   Cleared existing collections.');

  // ── Admin user ────────────────────────────────────────────────────────────
  // Password is hashed automatically by the pre-save hook in User model
  const admin = await User.create({
    email: 'admin@example.com',
    password: 'admin123',
    first_name: 'Admin',
    last_name: 'User',
    is_admin: true,
  });
  console.log(`👤  Admin created: ${admin.email}  (password: admin123)`);

  // ── Regular test user ────────────────────────────────────────────────────
  const regularUser = await User.create({
    email: 'user@example.com',
    password: 'user1234',
    first_name: 'Test',
    last_name: 'User',
    is_admin: false,
  });
  console.log(`👤  User created:  ${regularUser.email}  (password: user1234)`);

  // ── Sample events ─────────────────────────────────────────────────────────
  const events = await EventModel.insertMany([
    {
      title: 'Summer Rock Concert',
      description:
        'An electrifying night of rock music featuring top local and national bands. ' +
        'Get ready for an unforgettable experience under the stars.',
      date: new Date('2026-07-15T19:00:00Z'),
      location: 'Riverside Amphitheatre, Mumbai',
      price: 50,
      category: 'Concert',
      is_published: true,
      is_free: false,
      max_seats_per_user: 6,
      created_by: admin._id,
    },
    {
      title: 'Tech Summit 2026',
      description:
        'Join industry leaders for a full-day conference covering AI, Web3, ' +
        'and the future of software development. Workshops and networking included.',
      date: new Date('2026-08-20T09:00:00Z'),
      location: 'Convention Centre, Bangalore',
      price: 25,
      category: 'Conference',
      is_published: true,
      is_free: false,
      max_seats_per_user: 4,
      created_by: admin._id,
    },
    {
      title: 'Free Community Meetup',
      description:
        'A relaxed evening meetup for developers, designers, and product enthusiasts. ' +
        'Free drinks, lightning talks, and plenty of networking.',
      date: new Date('2026-06-10T18:30:00Z'),
      location: 'CoWork Hub, Delhi',
      price: 0,
      category: 'Meetup',
      is_published: true,
      is_free: true,
      max_seats_per_user: 10,
      created_by: admin._id,
    },
    {
      title: 'Championship Finals 2026',
      description:
        'The biggest sports event of the year. Watch the top teams battle for the championship ' +
        'trophy in an electrifying atmosphere.',
      date: new Date('2026-06-15T18:00:00Z'),
      location: 'National Stadium, Main Arena',
      price: 75,
      category: 'Sports',
      image_url: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800',
      is_published: true,
      is_free: false,
      max_seats_per_user: 6,
      created_by: admin._id,
    },
    {
      title: 'Romeo & Juliet - Modern Adaptation',
      description:
        "A breathtaking modern retelling of Shakespeare's classic tragedy. " +
        'Featuring stunning visuals and an award-winning cast.',
      date: new Date('2026-07-01T20:00:00Z'),
      location: 'Grand Theater Hall',
      price: 45,
      category: 'Theater',
      image_url: 'https://images.unsplash.com/photo-1503095392235-fc1bc0d8c8f5?w=800',
      is_published: true,
      is_free: false,
      max_seats_per_user: 8,
      created_by: admin._id,
    },
  ]);
  console.log(`🎪  ${events.length} events created.`);

  // ── Generate seats for each event ─────────────────────────────────────────
  // Layout: 12 rows (A–L) × 20 cols
  // Front 4 rows  (A–D): basePrice + 10  (premium)
  // Middle 4 rows (E–H): basePrice + 5   (standard)
  // Back 4 rows   (I–L): basePrice       (economy)
  const ROWS = 12;
  const COLS = 20;
  const SECTION = 4; // rows per tier

  let totalSeats = 0;

  for (const event of events) {
    const basePrice = event.is_free ? 0 : event.price;

    const rowLetters: string[] = [];
    for (let i = 0; i < ROWS; i++) {
      rowLetters.push(String.fromCharCode(65 + i)); // A–L
    }

    const frontRows  = rowLetters.slice(0, SECTION);             // A–D
    const middleRows = rowLetters.slice(SECTION, SECTION * 2);   // E–H
    const backRows   = rowLetters.slice(SECTION * 2);            // I–L

    const seats: {
      event_id: typeof event._id;
      row: string;
      number: number;
      price: number;
      status: 'available';
    }[] = [];

    for (const row of frontRows) {
      for (let col = 1; col <= COLS; col++) {
        seats.push({ event_id: event._id, row, number: col, price: basePrice + 10, status: 'available' });
      }
    }
    for (const row of middleRows) {
      for (let col = 1; col <= COLS; col++) {
        seats.push({ event_id: event._id, row, number: col, price: basePrice + 5, status: 'available' });
      }
    }
    for (const row of backRows) {
      for (let col = 1; col <= COLS; col++) {
        seats.push({ event_id: event._id, row, number: col, price: basePrice, status: 'available' });
      }
    }

    await SeatModel.insertMany(seats);
    totalSeats += seats.length;
    console.log(`💺  ${seats.length} seats created for "${event.title}".`);
  }

  console.log(`\n🎉  Seeded ${events.length} events with ${totalSeats} total seats\n`);
  console.log('   Admin login  →  admin@example.com  /  admin123');
  console.log('   User login   →  user@example.com   /  user1234\n');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
