// // Seeds the database with a demo admin, staff, rooms, and a resident.
// // Run with: npm run seed  (make sure MONGO_URI is set in .env)
// import dotenv from "dotenv";
// import connectDB from "../config/db.js";
// import User from "../models/User.js";
// import Room from "../models/Room.js";
// import Resident from "../models/Resident.js";

// dotenv.config();

// const seed = async () => {
//   await connectDB();

//   await Promise.all([User.deleteMany(), Room.deleteMany(), Resident.deleteMany()]);

//   const admin = await User.create({
//     name: "Admin User",
//     email: "admin@hostel.com",
//     password: "password123",
//     role: "admin",
//     phone: "+10000000001",
//   });

//   const staff = await User.create({
//     name: "Staff Member",
//     email: "staff@hostel.com",
//     password: "password123",
//     role: "staff",
//     phone: "+10000000002",
//   });

//   const residentUser = await User.create({
//     name: "Jane Resident",
//     email: "resident@hostel.com",
//     password: "password123",
//     role: "resident",
//     phone: "+10000000003",
//   });

//   const rooms = await Room.insertMany([
//     { roomNumber: "A-101", block: "A", floor: 1, type: "single", capacity: 1, pricePerMonth: 350, amenities: ["wifi", "desk"] },
//     { roomNumber: "A-102", block: "A", floor: 1, type: "double", capacity: 2, pricePerMonth: 250, amenities: ["wifi"] },
//     { roomNumber: "B-201", block: "B", floor: 2, type: "triple", capacity: 3, pricePerMonth: 200, amenities: ["wifi", "balcony"] },
//     { roomNumber: "B-202", block: "B", floor: 2, type: "dormitory", capacity: 6, pricePerMonth: 120, amenities: ["wifi", "lockers"] },
//   ]);

//   const resident = await Resident.create({
//     user: residentUser._id,
//     firstName: "Jane",
//     lastName: "Resident",
//     email: "resident@hostel.com",
//     phone: "+10000000003",
//     gender: "female",
//     status: "pending",
//     emergencyContact: { name: "John Doe", relationship: "Father", phone: "+10000000004" },
//   });

//   residentUser.resident = resident._id;
//   await residentUser.save();

//   console.log("Seed data created:");
//   console.log("  Admin:    admin@hostel.com / password123");
//   console.log("  Staff:    staff@hostel.com / password123");
//   console.log("  Resident: resident@hostel.com / password123");
//   console.log(`  Rooms created: ${rooms.length}`);
//   process.exit(0);
// };

// seed().catch((err) => {
//   console.error(err);
//   process.exit(1);
// });

// Seeds the database with demo admin, staff, residents, rooms.
// Run with: npm run seed
// Make sure MONGO_URI is set in .env

import dotenv from "dotenv";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Room from "../models/Room.js";
import Resident from "../models/Resident.js";

dotenv.config();

const seed = async () => {
  await connectDB();

  // Clear existing data
  await Promise.all([
    User.deleteMany(),
    Room.deleteMany(),
    Resident.deleteMany(),
  ]);

  // =========================
  // ADMIN
  // =========================
  await User.create({
    name: "Admin User",
    email: "admin@hostel.com",
    password: "password123",
    role: "admin",
    phone: "+10000000001",
  });

  // =========================
  // STAFF
  // =========================
  await User.create({
    name: "Staff Member",
    email: "staff@hostel.com",
    password: "password123",
    role: "staff",
    phone: "+10000000002",
  });

  // =========================
  // RESIDENT USERS
  // =========================
  const residentUsers = await User.create([
    {
      name: "Jane Resident",
      email: "jane@hostel.com",
      password: "password123",
      role: "resident",
      phone: "+10000000003",
    },
    {
      name: "John Smith",
      email: "john.smith@hostel.com",
      password: "password123",
      role: "resident",
      phone: "+10000000004",
    },
    {
      name: "Emily Johnson",
      email: "emily.johnson@hostel.com",
      password: "password123",
      role: "resident",
      phone: "+10000000005",
    },
    {
      name: "Michael Brown",
      email: "michael.brown@hostel.com",
      password: "password123",
      role: "resident",
      phone: "+10000000006",
    },
    {
      name: "Sarah Williams",
      email: "sarah.williams@hostel.com",
      password: "password123",
      role: "resident",
      phone: "+10000000007",
    },
    {
      name: "David Wilson",
      email: "david.wilson@hostel.com",
      password: "password123",
      role: "resident",
      phone: "+10000000008",
    },
    {
      name: "Olivia Taylor",
      email: "olivia.taylor@hostel.com",
      password: "password123",
      role: "resident",
      phone: "+10000000009",
    },
    {
      name: "Daniel Anderson",
      email: "daniel.anderson@hostel.com",
      password: "password123",
      role: "resident",
      phone: "+10000000010",
    },
    {
      name: "Sophia Thomas",
      email: "sophia.thomas@hostel.com",
      password: "password123",
      role: "resident",
      phone: "+10000000011",
    },
    {
      name: "James Martinez",
      email: "james.martinez@hostel.com",
      password: "password123",
      role: "resident",
      phone: "+10000000012",
    },
    {
      name: "Ava Garcia",
      email: "ava.garcia@hostel.com",
      password: "password123",
      role: "resident",
      phone: "+10000000013",
    },
  ]);

  // =========================
  // ROOMS
  // =========================
  const rooms = await Room.insertMany([
    {
      roomNumber: "A-101",
      block: "A",
      floor: 1,
      type: "single",
      capacity: 1,
      pricePerMonth: 350,
      amenities: ["wifi", "desk"],
    },
    {
      roomNumber: "A-102",
      block: "A",
      floor: 1,
      type: "double",
      capacity: 2,
      pricePerMonth: 250,
      amenities: ["wifi"],
    },
    {
      roomNumber: "B-201",
      block: "B",
      floor: 2,
      type: "triple",
      capacity: 3,
      pricePerMonth: 200,
      amenities: ["wifi", "balcony"],
    },
    {
      roomNumber: "B-202",
      block: "B",
      floor: 2,
      type: "dormitory",
      capacity: 6,
      pricePerMonth: 120,
      amenities: ["wifi", "lockers"],
    },
  ]);

  // =========================
  // RESIDENT PROFILES
  // =========================
  const residentData = [
    {
      firstName: "Jane",
      lastName: "Resident",
      gender: "female",
      occupation: "Student",
    },
    {
      firstName: "John",
      lastName: "Smith",
      gender: "male",
      occupation: "Student",
    },
    {
      firstName: "Emily",
      lastName: "Johnson",
      gender: "female",
      occupation: "Student",
    },
    {
      firstName: "Michael",
      lastName: "Brown",
      gender: "male",
      occupation: "Student",
    },
    {
      firstName: "Sarah",
      lastName: "Williams",
      gender: "female",
      occupation: "Student",
    },
    {
      firstName: "David",
      lastName: "Wilson",
      gender: "male",
      occupation: "Student",
    },
    {
      firstName: "Olivia",
      lastName: "Taylor",
      gender: "female",
      occupation: "Student",
    },
    {
      firstName: "Daniel",
      lastName: "Anderson",
      gender: "male",
      occupation: "Student",
    },
    {
      firstName: "Sophia",
      lastName: "Thomas",
      gender: "female",
      occupation: "Student",
    },
    {
      firstName: "James",
      lastName: "Martinez",
      gender: "male",
      occupation: "Student",
    },
    {
      firstName: "Ava",
      lastName: "Garcia",
      gender: "female",
      occupation: "Student",
    },
  ];

  // Create resident profiles and link them to User
  for (let i = 0; i < residentUsers.length; i++) {
    const user = residentUsers[i];
    const data = residentData[i];

    const resident = await Resident.create({
      user: user._id,
      firstName: data.firstName,
      lastName: data.lastName,
      email: user.email,
      phone: user.phone,
      gender: data.gender,
      occupation: data.occupation,
      status: "pending",
      emergencyContact: {
        name: "Emergency Contact",
        relationship: "Parent",
        phone: `+100000000${20 + i}`,
      },
    });

    // Link Resident back to User
    user.resident = resident._id;
    await user.save();
  }

  // =========================
  // SUCCESS MESSAGE
  // =========================
  console.log("=================================");
  console.log("Seed data created successfully!");
  console.log("=================================");
  console.log("Admin:");
  console.log("  Email:    admin@hostel.com");
  console.log("  Password: password123");

  console.log("\nStaff:");
  console.log("  Email:    staff@hostel.com");
  console.log("  Password: password123");

  console.log("\nResidents:");
  residentUsers.forEach((user) => {
    console.log(`  ${user.email} / password123`);
  });

  console.log(`\nRooms created: ${rooms.length}`);
  console.log("Residents created:", residentUsers.length);

  process.exit(0);
};

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});