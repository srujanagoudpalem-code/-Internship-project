import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Roles
  const roles = [
    { id: 1, name: 'ADMIN' },
    { id: 2, name: 'SUPPORT_EXECUTIVE' },
    { id: 3, name: 'CUSTOMER' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: { name: role.name },
      create: { id: role.id, name: role.name },
    });
  }
  console.log('Roles seeded.');

  // Hash passwords
  const passwordHash = await bcrypt.hash('password123', 10);

  // 2. Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@giftstore.com' },
    update: {},
    create: {
      email: 'admin@giftstore.com',
      passwordHash,
      name: 'Jane Doe (Admin)',
      phone: '+1234567890',
      roleId: 1, // ADMIN
    },
  });

  const support = await prisma.user.upsert({
    where: { email: 'support@giftstore.com' },
    update: {},
    create: {
      email: 'support@giftstore.com',
      passwordHash,
      name: 'John Smith (Support)',
      phone: '+1987654321',
      roleId: 2, // SUPPORT_EXECUTIVE
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@giftstore.com' },
    update: {},
    create: {
      email: 'customer@giftstore.com',
      passwordHash,
      name: 'Alice Cooper',
      phone: '+1555123456',
      roleId: 3, // CUSTOMER
    },
  });
  console.log('Users seeded (password is "password123").');

  // 3. Products
  const products = [
    {
      sku: 'GIFT-WOOD-FRAME-01',
      name: 'Custom Engraved Wooden Photo Frame',
      description: 'Laser engraved premium wood frame with personalized names and date.',
      price: 29.99,
      imageUrl: 'https://images.unsplash.com/photo-1544273677-c433136021d4?w=500',
    },
    {
      sku: 'GIFT-SLVR-RING-02',
      name: 'Personalized Silver Couple Promise Rings',
      description: 'Sterling silver matching rings with custom interior engraving.',
      price: 79.99,
      imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500',
    },
    {
      sku: 'GIFT-LTHR-WLLT-03',
      name: 'Customized Leather Men Travel Wallet',
      description: 'Genuine full-grain leather wallet with custom hot-stamped initials.',
      price: 45.00,
      imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=500',
    },
    {
      sku: 'GIFT-MUG-CERM-04',
      name: 'Personalized Ceramic Mug with Photo',
      description: 'Heat reactive ceramic mug that reveals a printed image when hot.',
      price: 14.99,
      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500',
    },
  ];

  const seededProducts = [];
  for (const prod of products) {
    const p = await prisma.product.upsert({
      where: { sku: prod.sku },
      update: prod,
      create: prod,
    });
    seededProducts.push(p);
  }
  console.log('Products seeded.');

  // 4. Mock Orders
  const order1 = await prisma.order.upsert({
    where: { orderNumber: 'ORD-98231A' },
    update: {},
    create: {
      orderNumber: 'ORD-98231A',
      userId: customer.id,
      purchaseDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      deliveryDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
      status: 'DELIVERED',
      orderItems: {
        create: [
          {
            productId: seededProducts[0].id,
            quantity: 1,
            price: seededProducts[0].price,
          },
          {
            productId: seededProducts[1].id,
            quantity: 1,
            price: seededProducts[1].price,
          },
        ],
      },
    },
  });

  const order2 = await prisma.order.upsert({
    where: { orderNumber: 'ORD-44129B' },
    update: {},
    create: {
      orderNumber: 'ORD-44129B',
      userId: customer.id,
      purchaseDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      deliveryDate: null,
      status: 'SHIPPED',
      orderItems: {
        create: [
          {
            productId: seededProducts[2].id,
            quantity: 1,
            price: seededProducts[2].price,
          },
        ],
      },
    },
  });

  const order3 = await prisma.order.upsert({
    where: { orderNumber: 'ORD-10928C' },
    update: {},
    create: {
      orderNumber: 'ORD-10928C',
      userId: customer.id,
      purchaseDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      deliveryDate: null,
      status: 'PROCESSING',
      orderItems: {
        create: [
          {
            productId: seededProducts[3].id,
            quantity: 2,
            price: seededProducts[3].price,
          },
        ],
      },
    },
  });

  console.log('Mock Orders seeded for customer: ORD-98231A, ORD-44129B, ORD-10928C');
  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
