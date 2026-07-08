/**
 * Development seed. Creates a demo owner with a small but realistic portfolio
 * so the dashboard, reports and lists render with meaningful data.
 *
 * Run with: `npm run db:seed`
 * Credentials: demo@propio.app / Demo1234!
 */
import { PrismaClient, PropertyStatus, PropertyType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { addMonths, startOfMonth, subMonths } from 'date-fns';

const prisma = new PrismaClient();

/**
 * Safety guard. This seed wipes and recreates the demo tenant, so it must never
 * touch the production database. We refuse to run when `DATABASE_URL` points at
 * a known production project (or NODE_ENV=production). Override only with an
 * explicit, deliberate `ALLOW_PROD_SEED=true`.
 */
const PRODUCTION_DB_MARKERS = ['imeqnlqshmwomzaocczc'];

function assertNotProduction(): void {
  const url = process.env.DATABASE_URL ?? '';
  const looksLikeProduction =
    process.env.NODE_ENV === 'production' ||
    PRODUCTION_DB_MARKERS.some((marker) => url.includes(marker));

  if (looksLikeProduction && process.env.ALLOW_PROD_SEED !== 'true') {
    throw new Error(
      'Refusing to seed: DATABASE_URL looks like PRODUCTION. This seed wipes ' +
        'the demo tenant. Point at a dev database, or set ALLOW_PROD_SEED=true ' +
        'to override (you almost never want this).',
    );
  }
}

async function main() {
  assertNotProduction();

  const email = 'demo@propio.app';
  const hashedPassword = await bcrypt.hash('Demo1234!', 12);

  // Idempotent: wipe the previous demo tenant tree and recreate.
  await prisma.user.deleteMany({ where: { email } });

  const owner = await prisma.user.create({
    data: {
      email,
      name: 'Demo Landlord',
      hashedPassword,
      emailVerified: new Date(),
      currency: 'USD',
    },
  });

  const [sunset, oceanview, cabin] = await Promise.all([
    prisma.property.create({
      data: {
        ownerId: owner.id,
        name: 'Sunset Apartment 4B',
        description:
          'Bright two-bedroom apartment with a balcony overlooking the park.',
        type: PropertyType.TRADITIONAL_RENTAL,
        status: PropertyStatus.OCCUPIED,
        addressLine: '123 Sunset Blvd, Apt 4B',
        city: 'Santo Domingo',
        country: 'DO',
        bedrooms: 2,
        bathrooms: 2,
        areaSqm: 92,
      },
    }),
    prisma.property.create({
      data: {
        ownerId: owner.id,
        name: 'Oceanview Studio',
        description: 'Compact studio two blocks from the beach.',
        type: PropertyType.VACATION_RENTAL,
        status: PropertyStatus.AVAILABLE,
        addressLine: '45 Malecón Ave',
        city: 'Punta Cana',
        country: 'DO',
        bedrooms: 1,
        bathrooms: 1,
        areaSqm: 40,
      },
    }),
    prisma.property.create({
      data: {
        ownerId: owner.id,
        name: 'Mountain Cabin',
        type: PropertyType.PERSONAL,
        status: PropertyStatus.MAINTENANCE,
        city: 'Jarabacoa',
        country: 'DO',
        bedrooms: 3,
        bathrooms: 2,
      },
    }),
  ]);

  const maria = await prisma.tenant.create({
    data: {
      ownerId: owner.id,
      firstName: 'María',
      lastName: 'García',
      email: 'maria.garcia@example.com',
      phone: '+1 809 555 0134',
      identification: '001-1234567-8',
      emergencyName: 'Pedro García',
      emergencyPhone: '+1 809 555 0199',
      emergencyRelation: 'Brother',
    },
  });

  const contract = await prisma.contract.create({
    data: {
      ownerId: owner.id,
      propertyId: sunset.id,
      tenantId: maria.id,
      startDate: subMonths(startOfMonth(new Date()), 6),
      endDate: addMonths(new Date(), 1), // expiring soon → shows on dashboard
      monthlyRent: 1200,
      currency: 'USD',
      dueDay: 5,
      securityDeposit: 1200,
      maintenanceIncluded: true,
      status: 'ACTIVE',
    },
  });

  // Six months of rent payments + receipts.
  for (let i = 5; i >= 0; i--) {
    const paidAt = subMonths(new Date(), i);
    const periodStart = startOfMonth(paidAt);
    const month = periodStart.toLocaleString('en', {
      month: 'long',
      year: 'numeric',
    });

    const payment = await prisma.payment.create({
      data: {
        ownerId: owner.id,
        contractId: contract.id,
        propertyId: sunset.id,
        tenantId: maria.id,
        amount: 1200,
        currency: 'USD',
        method: i % 2 === 0 ? 'TRANSFER' : 'CASH',
        status: 'COMPLETED',
        concept: `Rent — ${month}`,
        periodStart,
        paidAt,
      },
    });

    await prisma.receipt.create({
      data: {
        ownerId: owner.id,
        paymentId: payment.id,
        contractId: contract.id,
        propertyId: sunset.id,
        tenantId: maria.id,
        number: `REC-${paidAt.getFullYear()}-${String(6 - i).padStart(4, '0')}`,
        concept: `Rent — ${month}`,
        amount: 1200,
        currency: 'USD',
        balanceAfter: 0,
        issuedAt: paidAt,
      },
    });
  }

  // A few expenses across categories.
  const expenses: {
    category:
      | 'MAINTENANCE'
      | 'CLEANING'
      | 'UTILITIES'
      | 'REPAIRS'
      | 'CONDOMINIUM';
    description: string;
    amount: number;
    monthsAgo: number;
    propertyId?: string;
  }[] = [
    { category: 'MAINTENANCE', description: 'AC service', amount: 150, monthsAgo: 1, propertyId: sunset.id },
    { category: 'CLEANING', description: 'Deep cleaning', amount: 80, monthsAgo: 2, propertyId: oceanview.id },
    { category: 'UTILITIES', description: 'Water bill', amount: 45, monthsAgo: 0, propertyId: sunset.id },
    { category: 'REPAIRS', description: 'Roof leak repair', amount: 420, monthsAgo: 3, propertyId: cabin.id },
    { category: 'CONDOMINIUM', description: 'HOA fee', amount: 120, monthsAgo: 0, propertyId: sunset.id },
  ];

  for (const expense of expenses) {
    await prisma.expense.create({
      data: {
        ownerId: owner.id,
        propertyId: expense.propertyId,
        category: expense.category,
        description: expense.description,
        amount: expense.amount,
        currency: 'USD',
        incurredAt: subMonths(new Date(), expense.monthsAgo),
      },
    });
  }

  await prisma.notification.create({
    data: {
      ownerId: owner.id,
      type: 'CONTRACT_EXPIRING',
      title: 'Contract expiring soon',
      body: `The lease for Sunset Apartment 4B with María García ends next month.`,
      entityType: 'Contract',
      entityId: contract.id,
      actionUrl: `/app/contracts/${contract.id}`,
    },
  });

  await prisma.activity.createMany({
    data: [
      {
        ownerId: owner.id,
        action: 'CREATED',
        entityType: 'Property',
        entityId: sunset.id,
        summary: 'Added property “Sunset Apartment 4B”',
      },
      {
        ownerId: owner.id,
        action: 'PAYMENT_REGISTERED',
        entityType: 'Contract',
        entityId: contract.id,
        summary: 'Registered $1,200.00 from María García',
      },
    ],
  });

  console.warn(`Seeded demo account: ${email} / Demo1234!`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
