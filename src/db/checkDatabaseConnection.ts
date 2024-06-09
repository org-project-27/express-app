import { PrismaClient } from '@prisma/client';
import {$logged} from "#helpers/logHelpers";
import moment from "moment/moment";

const prisma = new PrismaClient();
const checkDatabaseConnection = async () => {
    try {
        // Try to run a simple query to check the connection
        await prisma.$connect();
        await prisma.$queryRaw`SELECT 1`;
        $logged('Prisma successfully connected', true, {from: 'prisma'});
        $logged("Database started!", true, {from: 'prisma'})
        await afterConnect(prisma)
    } catch (error) {
        console.error('PrismaError connecting to the database:', error);
        $logged('Database crashed', false, {from: 'prisma'})
        process.exit(1); // Exit the process with an error code
    }
    console.log('------------------------------------------------------------')
};

async function dropAllExpiredSessions(prisma: any){
    try {
        const sessions = await prisma.tokenSessions.findMany();
        for (const key in sessions){
            const session = sessions[key];
            if (moment(session.expired_in).isBefore(moment())) {
                await prisma.tokenSessions.findFirst({ where: { id: session.id } })
                    .then(async (result: any) => {
                        if (result) {
                            await prisma.tokenSessions.delete({ where: { id: session.id } });
                        }
                    })
                    .catch((error: any) => {
                        $logged(
                            error,
                            false,
                            {from: 'prisma'}
                        )
                    })
            }
        }
        $logged(
            'All expired token sessions dropped',
            true,
            {from: 'prisma'}
        )
    } catch (error: any) {
        $logged(
            error,
            false,
            {from: 'prisma'}
        )
    }
}

async function afterConnect(prisma: any){
    await dropAllExpiredSessions(prisma)
}

export default checkDatabaseConnection();