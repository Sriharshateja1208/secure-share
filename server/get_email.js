const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function findUser() {
    const users = await prisma.user.findMany({
        where: {
            fullname: {
                contains: 'Sri Harsha'
            }
        },
        select: {
            email: true,
            fullname: true
        }
    });

    if (users.length > 0) {
        console.log('Found user:');
        console.log('Full Name:', users[0].fullname);
        console.log('Email:', users[0].email);
        console.log('\n✅ Copy this EXACT email to login!');
    }

    await prisma.$disconnect();
}

findUser().catch(console.error);
