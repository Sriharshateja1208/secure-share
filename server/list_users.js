const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function listUsers() {
    console.log('=== ALL USERS IN DATABASE ===\n');

    const users = await prisma.user.findMany({
        select: {
            email: true,
            fullname: true,
            createdAt: true
        }
    });

    if (users.length === 0) {
        console.log('❌ NO USERS FOUND IN DATABASE');
        console.log('\nYou need to register first!');
    } else {
        console.log(`Found ${users.length} user(s):\n`);
        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.fullname} (${user.email})`);
            console.log(`   Created: ${user.createdAt}\n`);
        });
    }

    await prisma.$disconnect();
}

listUsers().catch(console.error);
