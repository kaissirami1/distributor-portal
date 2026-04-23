-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Submission" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "companyName" TEXT,
    "productName" TEXT NOT NULL,
    "category" TEXT,
    "cost" TEXT,
    "minimumOrder" TEXT,
    "city" TEXT,
    "county" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Submission" ("category", "city", "companyName", "cost", "county", "createdAt", "email", "id", "minimumOrder", "name", "notes", "productName") SELECT "category", "city", "companyName", "cost", "county", "createdAt", "email", "id", "minimumOrder", "name", "notes", "productName" FROM "Submission";
DROP TABLE "Submission";
ALTER TABLE "new_Submission" RENAME TO "Submission";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
