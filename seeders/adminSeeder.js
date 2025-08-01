// seeders/adminSeeder.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User'); // Adjust path to your User model

dotenv.config(); // Load environment variables

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/ankea_style", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    // await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding...');
  } catch (error) {
    console.error(`Error connecting to DB for seeding: ${error.message}`);
    process.exit(1);
  }
};

const seedAdminUser = async () => {
  await connectDB();

  try {
    // 1. Define admin user data (password will be hashed by the User model's pre-save hook)
    const adminUserData = {
      name: 'Ankea Admin', // Or any name you prefer
      email: 'admin@ankeastyle.in',
      password: 'Admin.Ankea9988', // This will be hashed automatically by the model
      role: 'admin',     // Mark as admin
    };

    // 2. Check if admin user already exists to prevent duplicates
    const existingAdmin = await User.findOne({ email: adminUserData.email });

    if (existingAdmin) {
      console.log('Admin user already exists. Skipping creation.');
      mongoose.connection.close();
      return;
    }

    // 3. Create the admin user
    const adminUser = await User.create(adminUserData);
    console.log(`Admin user '${adminUser.email}' created successfully!`);

  } catch (error) {
    console.error(`Error seeding admin user: ${error.message}`);
    process.exit(1);
  } finally {
    mongoose.connection.close(); // Close connection after seeding
  }
};

// seedAdminUser();
module.exports = seedAdminUser;
