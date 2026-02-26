import bcrypt from 'bcrypt';
import { prisma } from "../src/config/database";
import "dotenv/config";


async function main() {
  console.log('🌱 Starting database seed...');
  // Create Super Admin
  const hashedPassword = await bcrypt.hash('SuperAdmin123!', 10);
  const superAdmin = await prisma.admin.upsert({
    where: { email: 'admin@artistplatform.com' },
    update: {},
    create: {
      email: 'admin@artistplatform.com',
      password: hashedPassword,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
    },
  });

  console.log('✅ Created Super Admin:', superAdmin.email);

  // Create sample events
  const event1 = await prisma.event.create({
    data: {
      title: 'Summer Music Festival 2026',
      description: 'Join us for an amazing summer music festival featuring top artists from around the world.',
      venue: 'Central Park Arena',
      address: '123 Park Avenue',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      date: new Date('2026-07-15'),
      startTime: '18:00',
      endTime: '23:00',
      totalSeats: 5000,
      status: 'PUBLISHED',
      createdById: superAdmin.id,
      ticketTypes: {
        create: [
          {
            name: 'General Admission',
            description: 'Standard entry to the festival',
            price: 79.99,
            quantity: 3000,
            maxPerOrder: 10,
            salesStart: new Date('2026-03-01'),
            salesEnd: new Date('2026-07-14'),
          },
          {
            name: 'VIP',
            description: 'VIP access with backstage pass',
            price: 199.99,
            quantity: 500,
            maxPerOrder: 4,
            salesStart: new Date('2026-03-01'),
            salesEnd: new Date('2026-07-14'),
          },
          {
            name: 'Early Bird',
            description: 'Limited early bird tickets',
            price: 59.99,
            quantity: 1000,
            maxPerOrder: 6,
            salesStart: new Date('2026-02-01'),
            salesEnd: new Date('2026-02-28'),
          },
        ],
      },
    },
  });

  console.log('✅ Created Event:', event1.title);

  // Create sample products
  const products = await prisma.product.createMany({
    data: [
      {
        name: 'Artist Tour T-Shirt',
        description: 'Official tour merchandise - 100% cotton',
        price: 29.99,
        category: 'Apparel',
        stock: 500,
        sku: 'SHIRT-001',
        weight: 200,
        isFeatured: true,
        createdById: superAdmin.id,
      },
      {
        name: 'Limited Edition Vinyl',
        description: 'Collectors edition vinyl record',
        price: 49.99,
        category: 'Music',
        stock: 200,
        sku: 'VINYL-001',
        weight: 300,
        isFeatured: true,
        createdById: superAdmin.id,
      },
      {
        name: 'Tour Poster',
        description: 'Signed tour poster',
        price: 19.99,
        category: 'Memorabilia',
        stock: 150,
        sku: 'POSTER-001',
        weight: 100,
        createdById: superAdmin.id,
      },
      {
        name: 'Artist Hoodie',
        description: 'Premium quality hoodie with artist logo',
        price: 59.99,
        category: 'Apparel',
        stock: 300,
        sku: 'HOODIE-001',
        weight: 500,
        isFeatured: true,
        createdById: superAdmin.id,
      },
      {
        name: 'Coffee Mug',
        description: 'Ceramic mug with artist branding',
        price: 14.99,
        category: 'Accessories',
        stock: 400,
        sku: 'MUG-001',
        weight: 350,
        createdById: superAdmin.id,
      },
    ],
  });

  console.log('✅ Created Products:', products.count);

  // Create product variants for t-shirt
  const tshirt = await prisma.product.findFirst({
    where: { sku: 'SHIRT-001' },
  });

  if (tshirt) {
    await prisma.productVariant.createMany({
      data: [
        {
          productId: tshirt.id,
          name: 'Size: S',
          sku: 'SHIRT-001-S',
          stock: 100,
        },
        {
          productId: tshirt.id,
          name: 'Size: M',
          sku: 'SHIRT-001-M',
          stock: 150,
        },
        {
          productId: tshirt.id,
          name: 'Size: L',
          sku: 'SHIRT-001-L',
          stock: 150,
        },
        {
          productId: tshirt.id,
          name: 'Size: XL',
          sku: 'SHIRT-001-XL',
          stock: 100,
        },
      ],
    });

    console.log('✅ Created Product Variants for T-Shirt');
  }

  console.log('🎉 Database seed completed!');
  console.log('\n📧 Login Credentials:');
  console.log('Email: admin@artistplatform.com');
  console.log('Password: SuperAdmin123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });