import { PrismaClient } from '@prisma/client';
import {$logged} from "#helpers/generalHelpers";

const prisma = new PrismaClient();
const checkDatabaseConnection = async () => {
    try {
        // Try to run a simple query to check the connection
        await prisma.$connect();
        await prisma.$queryRaw`SELECT 1`;
        $logged('Prisma successfully connected', true, 'prisma');
        $logged("Database started!", true, 'prisma')
    } catch (error) {
        console.error('PrismaError connecting to the database:', error);
        $logged('Database crashed', false, 'prisma')
        process.exit(1); // Exit the process with an error code
    }
    console.log('----------------------------------------------------')
};
export default checkDatabaseConnection();