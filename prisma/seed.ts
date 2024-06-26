import { PrismaClient } from '@prisma/client';
import placeListTypes from './seeders/placeListTypes.json';
import users from './seeders/users.json';
import userDetails from './seeders/userDetails.json';
import tokenSessions from './seeders/tokenSessions.json';
import brands from './seeders/brands.json';
import placesList from './seeders/placesList.json';

const prisma = new PrismaClient();

async function main() {
  for (const user of users) {
    await prisma.users.upsert({
      where: { id: user.id },
      update: {},
      create: user,
    }).then((result) => console.log(`[📦] "users" seeds inserted: ${JSON.stringify(result)}`));
  }
  for (const details of userDetails) {
    await prisma.userDetails.upsert({
      where: { user_id: details.user_id },
      update: {},
      create: details,
    }).then((result) => console.log(`[📦] "userDetails" seeds inserted: ${JSON.stringify(result)}`));
  }
  for (const sessions of tokenSessions) {
    await prisma.tokenSessions.upsert({
      where: { id: sessions.id },
      update: {},
      create: sessions
    }).then((result) => console.log(`[📦] "tokenSessions" seeds inserted: ${JSON.stringify(result)}`));
  }
  for (const brand of brands) {
    await prisma.brands.upsert({
      where: { brand_id: brand.brand_id },
      update: {},
      create: brand
    }).then((result) => console.log(`[📦] "brands" seeds inserted: ${JSON.stringify(result)}`));
  }
  for (const type of placeListTypes) {
    await prisma.placeListType.upsert({
      where: { id: type.id },
      update: {},
      create: type,
    }).then((result) => console.log(`[📦] "placeListTypes" seeds inserted: ${JSON.stringify(result)}`));
  }
  for (const place of placesList) {
    await prisma.placesList.upsert({
      where: { place_id: place.data.place_id },
      update: {},
      create: place.data,
    }).then((result) => console.log(`[📦] "placesList" seeds inserted: ${JSON.stringify(result)}`));
  }
}

main().then((result) => {
    console.log('[🚀] All seeds successfully done!')
})
  .catch(e => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
