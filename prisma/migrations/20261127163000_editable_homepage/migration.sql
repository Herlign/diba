-- Editable website copy. Additive only.
-- New columns use the previous hard-coded words. Saved headlineLead and headlineRest are not updated.

ALTER TABLE "SiteContent" ADD COLUMN "searchLabel" TEXT NOT NULL DEFAULT $copy$Find your programme$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "searchPlaceholder" TEXT NOT NULL DEFAULT $copy$Find your programme — church, name or code$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "searchButton" TEXT NOT NULL DEFAULT $copy$Search$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "heroImageUrl" TEXT NOT NULL DEFAULT $copy$/images/jollof.jpg$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "heroImageAlt" TEXT NOT NULL DEFAULT $copy$Party jollof rice with grilled chicken skewers and fried fish$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "slipTitle" TEXT NOT NULL DEFAULT $copy$Reboot Camp · Surulere$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "platesHeading" TEXT NOT NULL DEFAULT $copy$Freshly prepared$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "platesIntro" TEXT NOT NULL DEFAULT $copy$Choose a slot, choose a plate, and collect it at a designated point inside the venue. Extras can be added to any slot.$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "programmesHeading" TEXT NOT NULL DEFAULT $copy$Upcoming programmes$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "programmesIntro" TEXT NOT NULL DEFAULT $copy$Published programmes only. Drafts stay in the office until the church is ready.$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "programmesLink" TEXT NOT NULL DEFAULT $copy$All programmes$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "statProgrammes" TEXT NOT NULL DEFAULT $copy$Programmes$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "statChurches" TEXT NOT NULL DEFAULT $copy$Churches$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "programmesEmptyTitle" TEXT NOT NULL DEFAULT $copy$Nothing is published yet$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "programmesEmptyBody" TEXT NOT NULL DEFAULT $copy$When a church opens a programme, it will land here.$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "programmesErrorTitle" TEXT NOT NULL DEFAULT $copy$The board didn't load$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "programmesErrorBody" TEXT NOT NULL DEFAULT $copy$Give it a second and refresh. A fresh checkout still needs the database seeded.$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "faqHeading" TEXT NOT NULL DEFAULT $copy$Before you order$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "navProgrammes" TEXT NOT NULL DEFAULT $copy$Programmes$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "navOrders" TEXT NOT NULL DEFAULT $copy$My orders$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "navCta" TEXT NOT NULL DEFAULT $copy$Open lists$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "logoAlt" TEXT NOT NULL DEFAULT $copy$Diba Meals$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "footerNote" TEXT NOT NULL DEFAULT $copy$Orders close 24 hours before each slot.$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "footerStaff" TEXT NOT NULL DEFAULT $copy$Staff$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "footerWhatsapp" TEXT NOT NULL DEFAULT $copy$WhatsApp support$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "whatsappE164" TEXT NOT NULL DEFAULT $copy$$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "photoCredit" TEXT NOT NULL DEFAULT $copy$Food photos, free to use, from Pexels: Keesha's Kitchen · Harrun Muhammad · Tim Yisa · PICHA · mk_photoz · Teguh S · kandhi bharata.$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "boardEyebrow" TEXT NOT NULL DEFAULT $copy$The board$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "boardTitle" TEXT NOT NULL DEFAULT $copy$Find your programme$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "boardIntro" TEXT NOT NULL DEFAULT $copy$Search by church, programme name, or the code on the poster. Ordering closes 24 hours before each slot.$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "boardPlaceholder" TEXT NOT NULL DEFAULT $copy$Church, programme name, or code$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "boardSearch" TEXT NOT NULL DEFAULT $copy$Search$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "boardClear" TEXT NOT NULL DEFAULT $copy$Clear$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "boardEmptyTitle" TEXT NOT NULL DEFAULT $copy$No programme matches that$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "boardEmptyBody" TEXT NOT NULL DEFAULT $copy$Try the code on the church poster, or clear the search.$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "boardMetaDescription" TEXT NOT NULL DEFAULT $copy$Find a church programme by name or code and see where Diba Meals is delivering.$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "boardShareDescription" TEXT NOT NULL DEFAULT $copy$Camps, congresses and convocations taking meal orders.$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "orderButton" TEXT NOT NULL DEFAULT $copy$Order meals$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "menuSoon" TEXT NOT NULL DEFAULT $copy$Menu soon$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "missingEyebrow" TEXT NOT NULL DEFAULT $copy$Missing page$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "missingTitle" TEXT NOT NULL DEFAULT $copy$That page is not on the menu$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "missingBody" TEXT NOT NULL DEFAULT $copy$The link may be old. The programme list is the place to start.$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "missingButton" TEXT NOT NULL DEFAULT $copy$Browse programmes$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "ordersEyebrow" TEXT NOT NULL DEFAULT $copy$My orders$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "ordersTitle" TEXT NOT NULL DEFAULT $copy$Find the meals you booked$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "ordersBody" TEXT NOT NULL DEFAULT $copy$Use the email from checkout. We'll send a link that opens every order on that address. It lasts 2 hours.$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "ordersEmailLabel" TEXT NOT NULL DEFAULT $copy$Email$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "ordersButton" TEXT NOT NULL DEFAULT $copy$Email me a link$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "ordersSending" TEXT NOT NULL DEFAULT $copy$Sending…$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "siteName" TEXT NOT NULL DEFAULT $copy$Diba Meals$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "socialExtra" TEXT NOT NULL DEFAULT $copy$Morning, afternoon and evening, delivered at the programme venue.$copy$;
ALTER TABLE "SiteContent" ADD COLUMN "ogImageAlt" TEXT NOT NULL DEFAULT $copy$Diba Meals$copy$;

ALTER TABLE "SiteContent" ADD COLUMN "logoUrl" TEXT;
ALTER TABLE "SiteContent" ADD COLUMN "ogImageUrl" TEXT;
ALTER TABLE "SiteContent" ADD COLUMN "faviconUrl" TEXT;

-- Original wording, only when the row is missing. A saved headline is left as it is.
INSERT INTO "SiteContent" ("id", "eyebrow", "headlineLead", "headlineRest", "hero", "footer", "updatedAt")
VALUES (
    'site',
    $copy$Freshly prepared · delivered at the venue$copy$,
    $copy$Never miss a meal.$copy$,
    $copy$Never miss a moment$copy$,
    $copy$From early morning sessions to evening conventions, enjoy freshly prepared, satisfying meals without the long walks, endless queues or stress of figuring out where to eat. Simply choose your meals, select your preferred slots, and let Diba take care of the rest with convenient delivery to designated points within your programme venue.$copy$,
    $copy$Freshly prepared meals, delivered to designated points within your programme venue.$copy$,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;

CREATE TABLE "HomeStep" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL DEFAULT 'site',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,

    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeStep_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HomeStep_siteId_position_idx" ON "HomeStep"("siteId", "position");
ALTER TABLE "HomeStep" ADD CONSTRAINT "HomeStep_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "SiteContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "HomeStep" ("id", "siteId", "title", "body", "position", "updatedAt")
VALUES
    ($copy$step-pick-days$copy$, 'site', $copy$Pick your days$copy$, $copy$Find the programme — by name, or by a code like REBOOT26 — and tick the days you are actually staying.$copy$, 0, CURRENT_TIMESTAMP),
    ($copy$step-choose-meals$copy$, 'site', $copy$Choose meals$copy$, $copy$Morning, afternoon, or evening. All-hours plates and extras can go in any slot. You can still change a slot.$copy$, 1, CURRENT_TIMESTAMP),
    ($copy$step-deliver$copy$, 'site', $copy$We deliver at the venue$copy$, $copy$Your meal is dropped at a designated point inside the programme venue.$copy$, 2, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

CREATE TABLE "HomeShowcase" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL DEFAULT 'site',
    "name" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imageAlt" TEXT NOT NULL,
    "imageFocus" TEXT NOT NULL DEFAULT '',

    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeShowcase_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HomeShowcase_siteId_position_idx" ON "HomeShowcase"("siteId", "position");
ALTER TABLE "HomeShowcase" ADD CONSTRAINT "HomeShowcase_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "SiteContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "HomeShowcase" ("id", "siteId", "name", "note", "imageUrl", "imageAlt", "imageFocus", "position", "updatedAt")
VALUES
    ($copy$plate-jollof$copy$, 'site', $copy$Diba Party Jollof & Chicken$copy$, $copy$All hours · from ₦3,850$copy$, $copy$/images/jollof.jpg$copy$, $copy$Party jollof rice with grilled chicken skewers and fried fish$copy$, $copy$$copy$, 0, CURRENT_TIMESTAMP),
    ($copy$plate-yam$copy$, 'site', $copy$Boiled yam & egg sauce$copy$, $copy$With tea or coffee · all hours$copy$, $copy$/images/yam-egg.jpg$copy$, $copy$Boiled yam with Nigerian egg sauce, eaten by a window$copy$, $copy$$copy$, 1, CURRENT_TIMESTAMP),
    ($copy$plate-basmati$copy$, 'site', $copy$Basmati rice & Chicken Delish$copy$, $copy$All hours · ₦6,500$copy$, $copy$/images/jollof-platter.jpg$copy$, $copy$Fried rice and peppered chicken on a table in Abuja$copy$, $copy$center 62%$copy$, 2, CURRENT_TIMESTAMP),
    ($copy$plate-chicken$copy$, 'site', $copy$Peppered chicken$copy$, $copy$An extra for any slot · ₦3,000$copy$, $copy$/images/grilled-chicken.jpg$copy$, $copy$Grilled chicken legs with charred skin and green chilli$copy$, $copy$$copy$, 3, CURRENT_TIMESTAMP),
    ($copy$plate-hake$copy$, 'site', $copy$Hake fish$copy$, $copy$An extra for any slot · from ₦1,500$copy$, $copy$/images/grilled-fish.jpg$copy$, $copy$Peppered fried fish with chilli on a plate$copy$, $copy$$copy$, 4, CURRENT_TIMESTAMP),
    ($copy$plate-plantain$copy$, 'site', $copy$Sweet plantain$copy$, $copy$An extra for any slot · ₦1,000$copy$, $copy$/images/plantain.jpg$copy$, $copy$Hands holding a bowl of sweet fried plantain$copy$, $copy$$copy$, 5, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

CREATE TABLE "HomeSlipLine" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL DEFAULT 'site',
    "whenLabel" TEXT NOT NULL,
    "plate" TEXT NOT NULL,

    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeSlipLine_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HomeSlipLine_siteId_position_idx" ON "HomeSlipLine"("siteId", "position");
ALTER TABLE "HomeSlipLine" ADD CONSTRAINT "HomeSlipLine_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "SiteContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "HomeSlipLine" ("id", "siteId", "whenLabel", "plate", "position", "updatedAt")
VALUES
    ($copy$slip-thu$copy$, 'site', $copy$Thu breakfast$copy$, $copy$Oats & moi-moi$copy$, 0, CURRENT_TIMESTAMP),
    ($copy$slip-fri$copy$, 'site', $copy$Fri lunch$copy$, $copy$Party jollof$copy$, 1, CURRENT_TIMESTAMP),
    ($copy$slip-sat$copy$, 'site', $copy$Sat dinner$copy$, $copy$Suya rice$copy$, 2, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

CREATE TABLE "HomeMarqueeItem" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL DEFAULT 'site',
    "label" TEXT NOT NULL,

    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeMarqueeItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HomeMarqueeItem_siteId_position_idx" ON "HomeMarqueeItem"("siteId", "position");
ALTER TABLE "HomeMarqueeItem" ADD CONSTRAINT "HomeMarqueeItem_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "SiteContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "HomeMarqueeItem" ("id", "siteId", "label", "position", "updatedAt")
VALUES
    ($copy$marquee-jollof$copy$, 'site', $copy$Party jollof$copy$, 0, CURRENT_TIMESTAMP),
    ($copy$marquee-ofada$copy$, 'site', $copy$Ofada & ayamase$copy$, 1, CURRENT_TIMESTAMP),
    ($copy$marquee-suya$copy$, 'site', $copy$Suya rice$copy$, 2, CURRENT_TIMESTAMP),
    ($copy$marquee-moimoi$copy$, 'site', $copy$Moi-moi$copy$, 3, CURRENT_TIMESTAMP),
    ($copy$marquee-shawarma$copy$, 'site', $copy$Shawarma$copy$, 4, CURRENT_TIMESTAMP),
    ($copy$marquee-yamarita$copy$, 'site', $copy$Yamarita$copy$, 5, CURRENT_TIMESTAMP),
    ($copy$marquee-plantain$copy$, 'site', $copy$Sweet plantain$copy$, 6, CURRENT_TIMESTAMP),
    ($copy$marquee-basmati$copy$, 'site', $copy$Basmati rice$copy$, 7, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

CREATE TABLE "HomeTrustPoint" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL DEFAULT 'site',
    "label" TEXT NOT NULL,

    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeTrustPoint_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HomeTrustPoint_siteId_position_idx" ON "HomeTrustPoint"("siteId", "position");
ALTER TABLE "HomeTrustPoint" ADD CONSTRAINT "HomeTrustPoint_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "SiteContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "HomeTrustPoint" ("id", "siteId", "label", "position", "updatedAt")
VALUES
    ($copy$trust-cutoff$copy$, 'site', $copy$Cutoff is 24 hours before$copy$, 0, CURRENT_TIMESTAMP),
    ($copy$trust-windows$copy$, 'site', $copy$Morning 7–10am · Afternoon 1–3pm · Evening 6–8pm$copy$, 1, CURRENT_TIMESTAMP),
    ($copy$trust-venue$copy$, 'site', $copy$Delivered at the venue$copy$, 2, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
