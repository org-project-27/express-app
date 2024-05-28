import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const checkDatabaseConnection = async () => {
    try {
        // Try to run a simple query to check the connection
        await prisma.$connect();
        await prisma.$queryRaw`SELECT 1`;
        console.log(':: Prisma successfully connected');
        console.log(":: Database started at:", new Date())
    } catch (error) {
        console.error(':: Error connecting to the database:', error);
        console.warn(":: Database crashed at:", new Date())
        process.exit(1); // Exit the process with an error code
    }
    console.log('------------------------------------------------')
};
export default checkDatabaseConnection();