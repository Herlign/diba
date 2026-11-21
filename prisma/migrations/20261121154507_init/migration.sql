-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'ATTENDEE',
    "passwordHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Programme" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "ministryName" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "venueName" TEXT NOT NULL,
    "venueAddress" TEXT NOT NULL,
    "landmark" TEXT,
    "startsOn" DATETIME NOT NULL,
    "endsOn" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Lagos',
    "cutoffRule" TEXT NOT NULL DEFAULT 'PREVIOUS_DAY_18',
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "accent" TEXT NOT NULL DEFAULT 'palm',
    "contactName" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "coordinatorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Programme_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProgrammeDay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "programmeId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    CONSTRAINT "ProgrammeDay_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MealSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "programmeDayId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "serveAt" DATETIME NOT NULL,
    "orderCutoffAt" DATETIME NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    CONSTRAINT "MealSlot_programmeDayId_fkey" FOREIGN KEY ("programmeDayId") REFERENCES "ProgrammeDay" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priceKobo" INTEGER NOT NULL,
    "spiceLevel" TEXT NOT NULL DEFAULT 'MILD',
    "isVegetarian" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "allergens" TEXT NOT NULL DEFAULT ''
);

-- CreateTable
CREATE TABLE "SlotOffering" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mealSlotId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "priceKoboOverride" INTEGER,
    "maxPortions" INTEGER,
    "portionsSold" INTEGER NOT NULL DEFAULT 0,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "SlotOffering_mealSlotId_fkey" FOREIGN KEY ("mealSlotId") REFERENCES "MealSlot" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SlotOffering_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DropPoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "programmeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "instructions" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL,
    CONSTRAINT "DropPoint_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference" TEXT NOT NULL,
    "userId" TEXT,
    "programmeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CART',
    "fulfilment" TEXT NOT NULL DEFAULT 'SECTION_DROP',
    "dropPointId" TEXT,
    "contactName" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "guestEmail" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "addressLine" TEXT,
    "area" TEXT,
    "addressCity" TEXT,
    "subtotalKobo" INTEGER NOT NULL DEFAULT 0,
    "serviceFeeKobo" INTEGER NOT NULL DEFAULT 0,
    "totalKobo" INTEGER NOT NULL DEFAULT 0,
    "cancellationNote" TEXT,
    "placedAt" DATETIME,
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_dropPointId_fkey" FOREIGN KEY ("dropPointId") REFERENCES "DropPoint" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrderLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "slotOfferingId" TEXT,
    "parentLineId" TEXT,
    "itemName" TEXT NOT NULL,
    "slotLabel" TEXT NOT NULL,
    "serveAt" DATETIME NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceKobo" INTEGER NOT NULL,
    "lineTotalKobo" INTEGER NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "OrderLine_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderLine_slotOfferingId_fkey" FOREIGN KEY ("slotOfferingId") REFERENCES "SlotOffering" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "OrderLine_parentLineId_fkey" FOREIGN KEY ("parentLineId") REFERENCES "OrderLine" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'PAYSTACK',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "amountKobo" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "reference" TEXT NOT NULL,
    "channel" TEXT,
    "paidAt" DATETIME,
    "refundedKobo" INTEGER NOT NULL DEFAULT 0,
    "rawPayload" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Delivery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "riderId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UNASSIGNED',
    "assignedAt" DATETIME,
    "pickedUpAt" DATETIME,
    "deliveredAt" DATETIME,
    "proofNote" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Delivery_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Delivery_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KitchenBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mealSlotId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "slotOfferingId" TEXT,
    "portionsPlanned" INTEGER NOT NULL DEFAULT 0,
    "portionsPacked" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KitchenBatch_mealSlotId_fkey" FOREIGN KEY ("mealSlotId") REFERENCES "MealSlot" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "KitchenBatch_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "KitchenBatch_slotOfferingId_fkey" FOREIGN KEY ("slotOfferingId") REFERENCES "SlotOffering" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Programme_slug_key" ON "Programme"("slug");

-- CreateIndex
CREATE INDEX "Programme_status_startsOn_idx" ON "Programme"("status", "startsOn");

-- CreateIndex
CREATE INDEX "Programme_city_idx" ON "Programme"("city");

-- CreateIndex
CREATE INDEX "ProgrammeDay_programmeId_sortOrder_idx" ON "ProgrammeDay"("programmeId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ProgrammeDay_programmeId_date_key" ON "ProgrammeDay"("programmeId", "date");

-- CreateIndex
CREATE INDEX "MealSlot_serveAt_idx" ON "MealSlot"("serveAt");

-- CreateIndex
CREATE UNIQUE INDEX "MealSlot_programmeDayId_kind_key" ON "MealSlot"("programmeDayId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "MenuItem_slug_key" ON "MenuItem"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SlotOffering_mealSlotId_menuItemId_key" ON "SlotOffering"("mealSlotId", "menuItemId");

-- CreateIndex
CREATE UNIQUE INDEX "DropPoint_programmeId_name_key" ON "DropPoint"("programmeId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Order_reference_key" ON "Order"("reference");

-- CreateIndex
CREATE INDEX "Order_programmeId_status_idx" ON "Order"("programmeId", "status");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "OrderLine_orderId_idx" ON "OrderLine"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_orderId_key" ON "Payment"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_reference_key" ON "Payment"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Delivery_orderId_key" ON "Delivery"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "KitchenBatch_mealSlotId_menuItemId_key" ON "KitchenBatch"("mealSlotId", "menuItemId");
