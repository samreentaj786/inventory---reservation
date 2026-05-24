// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.reservation.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();

  // Create warehouses
  const [warehouseA, warehouseB, warehouseC] = await Promise.all([
    prisma.warehouse.create({
      data: { name: "East Coast Hub", location: "New York, NY" },
    }),
    prisma.warehouse.create({
      data: { name: "West Coast Hub", location: "Los Angeles, CA" },
    }),
    prisma.warehouse.create({
      data: { name: "Central Distribution", location: "Dallas, TX" },
    }),
  ]);

  // Create products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: "Mechanical Keyboard Pro",
        description: "Tactile switches, RGB backlight, aluminum frame",
        sku: "KB-PRO-001",
        price: 189.99,
        imageUrl: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400&h=300&fit=crop",
      },
    }),
    prisma.product.create({
      data: {
        name: "Ultrawide Monitor 34\"",
        description: "4K curved display, 144Hz, HDR support",
        sku: "MON-UW-034",
        price: 799.99,
        imageUrl: "https://images.unsplash.com/photo-1547082299-de196ea013d6?w=400&h=300&fit=crop",
      },
    }),
    prisma.product.create({
      data: {
        name: "Wireless Noise-Cancelling Headphones",
        description: "40hr battery, premium drivers, foldable",
        sku: "AUD-WNC-200",
        price: 349.99,
        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop",
      },
    }),
    prisma.product.create({
      data: {
        name: "Ergonomic Office Chair",
        description: "Lumbar support, adjustable armrests, mesh back",
        sku: "FRN-CHR-ERG",
        price: 459.99,
        imageUrl: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=400&h=300&fit=crop",
      },
    }),
    prisma.product.create({
      data: {
        name: "USB-C Hub 12-in-1",
        description: "4K HDMI, Thunderbolt 3, 100W PD, SD card slots",
        sku: "ACC-HUB-12C",
        price: 89.99,
        imageUrl: "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=400&h=300&fit=crop",
      },
    }),
    prisma.product.create({
      data: {
        name: "Standing Desk Electric",
        description: "Dual motor, memory presets, cable management",
        sku: "FRN-DSK-STE",
        price: 649.99,
        imageUrl: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&h=300&fit=crop",
      },
    }),
  ]);

  // Create inventory across warehouses (varied stock to show multi-warehouse)
  const inventoryData = [
    // Keyboard
    { product: products[0], warehouse: warehouseA, total: 45, reserved: 3 },
    { product: products[0], warehouse: warehouseB, total: 30, reserved: 5 },
    { product: products[0], warehouse: warehouseC, total: 2, reserved: 1 }, // Low stock!
    // Monitor
    { product: products[1], warehouse: warehouseA, total: 12, reserved: 2 },
    { product: products[1], warehouse: warehouseB, total: 8, reserved: 0 },
    { product: products[1], warehouse: warehouseC, total: 1, reserved: 0 }, // Last one!
    // Headphones
    { product: products[2], warehouse: warehouseA, total: 60, reserved: 10 },
    { product: products[2], warehouse: warehouseB, total: 40, reserved: 4 },
    { product: products[2], warehouse: warehouseC, total: 25, reserved: 2 },
    // Chair
    { product: products[3], warehouse: warehouseA, total: 5, reserved: 1 },
    { product: products[3], warehouse: warehouseB, total: 3, reserved: 2 },
    { product: products[3], warehouse: warehouseC, total: 0, reserved: 0 }, // Out of stock!
    // Hub
    { product: products[4], warehouse: warehouseA, total: 100, reserved: 5 },
    { product: products[4], warehouse: warehouseB, total: 75, reserved: 3 },
    { product: products[4], warehouse: warehouseC, total: 50, reserved: 1 },
    // Desk
    { product: products[5], warehouse: warehouseA, total: 4, reserved: 0 },
    { product: products[5], warehouse: warehouseB, total: 2, reserved: 1 },
    { product: products[5], warehouse: warehouseC, total: 1, reserved: 0 },
  ];

  for (const inv of inventoryData) {
    await prisma.inventory.create({
      data: {
        productId: inv.product.id,
        warehouseId: inv.warehouse.id,
        totalUnits: inv.total,
        reservedUnits: inv.reserved,
      },
    });
  }

  console.log(`✅ Created ${products.length} products`);
  console.log(`✅ Created 3 warehouses`);
  console.log(`✅ Created ${inventoryData.length} inventory records`);
  console.log("🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
