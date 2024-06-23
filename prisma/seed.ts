import { PrismaClient } from '@prisma/client';
import placeListTypes from './seeders/placeListTypes';
import users from './seeders/users';
import userDetails from './seeders/userDetails';

const prisma = new PrismaClient();

async function main() {
  for (const type of placeListTypes) {
    await prisma.placeListType.upsert({
      where: { id: type.id },
      update: {},
      create: type,
    });
  }
  for (const user of users) {
    await prisma.users.upsert({
      where: { id: user.id },
      update: {},
      create: user,
    });
  }
  for (const details of userDetails) {
    await prisma.userDetails.upsert({
      where: { user_id: details.user_id },
      update: {},
      create: details,
    });
  }
}

main().then(() => {
    console.log('[🚀] All seeds done!')
})
  .catch(e => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
