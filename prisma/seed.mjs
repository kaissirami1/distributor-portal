// Fills an EMPTY development database with fake products and submissions.
// Run with: npm run db:seed
// It refuses to run on a database that already has data, so it can never
// touch the live site.

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

const products = [
    { name: "Ashta Cream", origin: "Lebanese", description: "Rich clotted cream used in Lebanese desserts like knafeh and atayef." },
    { name: "Za'atar Blend", origin: "Lebanese", description: "Thyme, sumac and toasted sesame. A pantry staple for manakish and dips." },
    { name: "Pomegranate Molasses", origin: "Lebanese", description: "Tangy, thick reduction of pure pomegranate juice for dressings and marinades." },
    { name: "Ma'amoul Date Cookies", origin: "Lebanese", description: "Semolina shortbread filled with dates, made in small batches." },
    { name: "Mole Poblano Paste", origin: "Mexican", description: "Traditional chile and chocolate mole base, ready to thin with broth." },
    { name: "Calabrian Chili Oil", origin: "Italian", description: "Crushed Calabrian chilies in olive oil. Medium heat, bright flavor." },
];

const submissions = [
    {
        name: "Maya Haddad", email: "maya@example.com", phone: "(714) 555-0101", companyName: "Cedar Kitchen Co.",
        productName: "Spiced Olive Medley", category: "Food & Beverage", cost: "$4.25", minimumOrder: "48 jars",
        city: "Anaheim", county: "Orange", status: "approved", days: 26,
        history: ["reviewing", "approved"],
        notes: ["Great packaging, shelf-stable for 18 months.", "Approved for Orange County pilot."],
        sales: [{ quantity: 48, revenue: 312.0, note: "First order — Anaheim market", days: 12 }, { quantity: 24, revenue: 156.0, days: 4 }],
    },
    {
        name: "Daniel Ortiz", email: "daniel@example.com", companyName: "Sol Salsas",
        productName: "Roasted Tomatillo Salsa", category: "Food & Beverage", cost: "$3.10", minimumOrder: "12 cases",
        city: "Santa Ana", county: "Orange", status: "reviewing", days: 18,
        history: ["reviewing"], notes: ["Asked for nutrition label PDF."],
    },
    {
        name: "Priya Nair", email: "priya@example.com", phone: "(619) 555-0144", companyName: "Bloom Home Goods",
        productName: "Soy Candle Gift Set", category: "Lifestyle", cost: "$11.00", minimumOrder: "24 sets",
        city: "San Diego", county: "San Diego", status: "pending", days: 9,
    },
    {
        name: "Sam Whitfield", email: "sam@example.com", companyName: "Clean Path",
        productName: "Plant-Based Dish Soap", category: "Household", cost: "$2.80", minimumOrder: "36 bottles",
        city: "Irvine", county: "Orange", status: "rejected", days: 22,
        history: ["reviewing", "rejected"], notes: ["Price point too high for our current retailers."],
    },
    {
        name: "Leila Mansour", email: "leila@example.com", phone: "(310) 555-0190", companyName: "Mansour Sweets",
        productName: "Pistachio Baklava Tray", category: "Specialty Retail", cost: "$9.50", minimumOrder: "20 trays",
        city: "Los Angeles", county: "Los Angeles", status: "approved", days: 15,
        history: ["reviewing", "approved"],
        sales: [{ quantity: 20, revenue: 380.0, note: "Glendale specialty store", days: 6 }],
    },
    {
        name: "Chris Park", email: "chris@example.com", companyName: "Kimchi Bros",
        productName: "Small-Batch Kimchi", category: "Food & Beverage", cost: "$5.75", minimumOrder: "30 jars",
        city: "Garden Grove", county: "Orange", status: "pending", days: 3,
    },
    {
        name: "Ana Lucia Reyes", email: "ana@example.com", companyName: "Raíz Tea",
        productName: "Hibiscus Cold Brew Tea", category: "Emerging Brands", minimumOrder: "10 cases",
        city: "Riverside", county: "Riverside", status: "pending", days: 1,
        notes: ["Interesting — check if they have a UPC yet."],
    },
];

async function main() {
    const [submissionCount, productCount] = await Promise.all([
        prisma.submission.count(),
        prisma.product.count(),
    ]);
    if (submissionCount > 0 || productCount > 0) {
        console.error("This database already has data. The seed only runs on an empty database.");
        process.exit(1);
    }

    await prisma.product.createMany({
        data: products.map((p, i) => ({ ...p, createdAt: daysAgo(30 - i) })),
    });

    for (const [i, s] of submissions.entries()) {
        const { days, history = [], notes = [], sales = [], ...fields } = s;
        const created = daysAgo(days);

        let from = "pending";
        const statusEvents = history.map((to, j) => {
            const event = { fromStatus: from, toStatus: to, createdAt: daysAgo(days - j - 1) };
            from = to;
            return event;
        });

        await prisma.submission.create({
            data: {
                ...fields,
                trackingId: `MKR-${String(i + 1).padStart(5, "0")}`,
                createdAt: created,
                statusEvents: { create: statusEvents },
                reviewNotes: { create: notes.map((content, j) => ({ content, createdAt: daysAgo(days - j - 0.5) })) },
                sales: { create: sales.map(({ days: d, ...sale }) => ({ ...sale, createdAt: daysAgo(d) })) },
            },
        });
    }

    console.log(`Seeded ${products.length} products and ${submissions.length} submissions.`);
}

main()
    .catch((err) => {
        console.error(err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
