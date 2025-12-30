import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const guestUsers = [
    {
        name: 'Guest Student',
        email: 'guest.student@demo.com',
        password: 'guest123',
        role: 'student',
        department: 'Computer Science'
    },
    {
        name: 'Guest Professor',
        email: 'guest.professor@demo.com',
        password: 'guest123',
        role: 'professor',
        department: 'Computer Science'
    },
    {
        name: 'Guest HOD',
        email: 'guest.hod@demo.com',
        password: 'guest123',
        role: 'hod',
        department: 'Computer Science'
    },
    {
        name: 'Guest Director',
        email: 'guest.director@demo.com',
        password: 'guest123',
        role: 'director'
    }
];

const seedGuestUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected for seeding...');

        for (const userData of guestUsers) {
            const existingUser = await User.findOne({ email: userData.email });

            if (!existingUser) {
                await User.create(userData);
                console.log(`✅ Created guest user: ${userData.email}`);
            } else {
                console.log(`⏭️  Guest user already exists: ${userData.email}`);
            }
        }

        console.log('\n🎉 Guest users seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding guest users:', error);
        process.exit(1);
    }
};

seedGuestUsers();
