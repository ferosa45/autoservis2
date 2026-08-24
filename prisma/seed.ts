import { PrismaClient, JobStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding databáze...');

  // Vyčistit v pořadí respektujícím foreign keys
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.task.deleteMany();
  await prisma.jobItem.deleteMany();
  await prisma.jobTask.deleteMany();
  await prisma.job.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.garage.deleteMany();

  const garage = await prisma.garage.create({
    data: {
      name: 'Autoservis Novák',
      companyName: 'Jan Novák - Autoservis',
      ico: '12345678',
      street: 'Průmyslová 145',
      city: 'Brno',
      zip: '61900',
      phone: '608123456',
      email: 'servis@autoservisnovak.cz',
      isVatPayer: false,
      invoicePrefix: '2026',
      nextInvoiceNumber: 1,
      invoiceDueDays: 14,
      // Seed servis pro vývoj/testování - rovnou ACTIVE, ať práce na appce
      // není omezená vypršením trialu.
      subscriptionStatus: 'ACTIVE',
      trialEndsAt: new Date(),
    },
  });

  const passwordHash = await bcrypt.hash('heslo123', 10);

  const owner = await prisma.user.create({
    data: {
      name: 'Jan Novák',
      email: 'jan@autoservisnovak.cz',
      password: passwordHash,
      role: 'OWNER',
      garageId: garage.id,
    },
  });

  const [zakaznikNovak, zakaznikMaly, zakaznikDvorak, firmaNovak] = await Promise.all([
    prisma.customer.create({
      data: { name: 'Jan Novák', phone: '608123456', garageId: garage.id },
    }),
    prisma.customer.create({
      data: { name: 'Petr Malý', phone: '724556677', garageId: garage.id },
    }),
    prisma.customer.create({
      data: { name: 'Lukáš Dvořák', phone: '739112233', garageId: garage.id },
    }),
    prisma.customer.create({
      data: {
        name: 'Stavební firma Novák',
        companyName: 'Stavební firma Novák s.r.o.',
        ico: '87654321',
        dic: 'CZ87654321',
        street: 'Dělnická 22',
        city: 'Brno',
        zip: '61700',
        phone: '605998877',
        garageId: garage.id,
      },
    }),
  ]);

  const [octavia, bmw, passat, transit] = await Promise.all([
    prisma.vehicle.create({
      data: {
        brand: 'Škoda',
        model: 'Octavia III',
        licensePlate: '5T4 8241',
        year: 2016,
        mileage: 142000,
        customerId: zakaznikNovak.id,
        garageId: garage.id,
      },
    }),
    prisma.vehicle.create({
      data: {
        brand: 'BMW',
        model: '320D',
        licensePlate: '8T2 1934',
        year: 2018,
        mileage: 98000,
        customerId: zakaznikMaly.id,
        garageId: garage.id,
      },
    }),
    prisma.vehicle.create({
      data: {
        brand: 'VW',
        model: 'Passat B7',
        licensePlate: '1TA 7845',
        year: 2014,
        mileage: 187000,
        customerId: zakaznikDvorak.id,
        garageId: garage.id,
      },
    }),
    prisma.vehicle.create({
      data: {
        brand: 'Ford',
        model: 'Transit',
        licensePlate: '7T8 1123',
        year: 2019,
        mileage: 76000,
        customerId: firmaNovak.id,
        garageId: garage.id,
      },
    }),
  ]);

  // Dnešní datum pro seed zakázek - aby "Dnes" a "Kalendář" hned něco ukazovaly
  const today = new Date();
  const at = (hour: number, minute = 0) => {
    const d = new Date(today);
    d.setHours(hour, minute, 0, 0);
    return d;
  };

  const job1 = await prisma.job.create({
    data: {
      number: '1',
      customerId: zakaznikNovak.id,
      vehicleId: octavia.id,
      scheduledStart: at(8, 0),
      scheduledEnd: at(9, 30),
      status: JobStatus.WAITING,
      customerRequest: 'Výměna oleje a filtrů, zkontrolovat brzdy',
      assignedUserId: owner.id,
      garageId: garage.id,
    },
  });
  await prisma.jobTask.createMany({
    data: [
      { title: 'Výměna motorového oleje a filtrů', completed: false, jobId: job1.id, garageId: garage.id },
      { title: 'Zkontrolovat brzdy', completed: false, jobId: job1.id, garageId: garage.id },
    ],
  });
  await prisma.jobItem.createMany({
    data: [
      { title: 'Výměna motorového oleje', quantity: 1, unit: 'h', unitPrice: 850, jobId: job1.id, garageId: garage.id },
      { title: 'Olej Castrol EDGE 5W-30', quantity: 5, unit: 'l', unitPrice: 250, jobId: job1.id, garageId: garage.id },
      { title: 'Olejový filtr Mann', quantity: 1, unit: 'ks', unitPrice: 285, jobId: job1.id, garageId: garage.id },
    ],
  });

  const job2 = await prisma.job.create({
    data: {
      number: '2',
      customerId: zakaznikMaly.id,
      vehicleId: bmw.id,
      scheduledStart: at(10, 0),
      scheduledEnd: at(12, 0),
      status: JobStatus.IN_PROGRESS,
      customerRequest: 'Klepání od přední nápravy',
      assignedUserId: owner.id,
      garageId: garage.id,
    },
  });
  await prisma.jobTask.createMany({
    data: [
      { title: 'Diagnostika klepání přední nápravy', completed: true, jobId: job2.id, garageId: garage.id },
      { title: 'Výměna horních uložení tlumičů', completed: false, jobId: job2.id, garageId: garage.id },
    ],
  });
  await prisma.jobItem.createMany({
    data: [
      { title: 'Diagnostika podvozku', quantity: 1, unit: 'h', unitPrice: 650, jobId: job2.id, garageId: garage.id },
      { title: 'Horní uložení tlumiče (pár)', quantity: 1, unit: 'ks', unitPrice: 1450, jobId: job2.id, garageId: garage.id },
    ],
  });

  const job3 = await prisma.job.create({
    data: {
      number: '3',
      customerId: zakaznikDvorak.id,
      vehicleId: passat.id,
      scheduledStart: at(13, 30),
      scheduledEnd: at(14, 30),
      status: JobStatus.BLOCKED,
      customerRequest: 'Diagnostika - kontrolka motoru',
      note: 'Čeká se na objednaný snímač tlaku',
      garageId: garage.id,
    },
  });
  await prisma.jobTask.create({
    data: { title: 'Diagnostika chybového kódu', completed: true, jobId: job3.id, garageId: garage.id },
  });

  const job4 = await prisma.job.create({
    data: {
      number: '4',
      customerId: firmaNovak.id,
      vehicleId: transit.id,
      scheduledStart: at(9, 0),
      scheduledEnd: at(10, 0),
      status: JobStatus.DONE,
      customerRequest: 'Výměna rozvodů',
      garageId: garage.id,
    },
  });
  await prisma.jobItem.createMany({
    data: [
      { title: 'Výměna rozvodové sady', quantity: 3, unit: 'h', unitPrice: 750, jobId: job4.id, garageId: garage.id },
      { title: 'Rozvodová sada Contitech', quantity: 1, unit: 'ks', unitPrice: 3200, jobId: job4.id, garageId: garage.id },
    ],
  });

  await prisma.task.createMany({
    data: [
      {
        title: 'Objednat díly – rozvody Transit',
        completed: true,
        dueDate: today,
        jobId: job4.id,
        garageId: garage.id,
      },
      {
        title: 'Zavolat zákazníkovi – BMW 320D',
        completed: false,
        dueDate: today,
        jobId: job2.id,
        garageId: garage.id,
      },
      {
        title: 'Zkontrolovat zásoby motorového oleje',
        completed: false,
        dueDate: today,
        garageId: garage.id,
      },
    ],
  });

  console.log('Seed dokončen.');
  console.log('Přihlášení: jan@autoservisnovak.cz / heslo123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
