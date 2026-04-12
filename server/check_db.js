const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.findMany().then(u => { console.dir(u); process.exit(0) }).catch(e => { console.error(e); process.exit(1); });
