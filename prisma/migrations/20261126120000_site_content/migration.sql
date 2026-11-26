-- Homepage copy and questions. Additive only: existing orders and menu rows are unchanged.

CREATE TABLE "SiteContent" (
    "id" TEXT NOT NULL DEFAULT 'site',
    "eyebrow" TEXT NOT NULL,
    "headlineLead" TEXT NOT NULL,
    "headlineRest" TEXT NOT NULL,
    "hero" TEXT NOT NULL,
    "footer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteContent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FaqEntry" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL DEFAULT 'site',
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FaqEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FaqEntry_siteId_position_idx" ON "FaqEntry"("siteId", "position");

ALTER TABLE "FaqEntry" ADD CONSTRAINT "FaqEntry_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "SiteContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Original homepage wording, so the live site stays the same until a manager edits it.
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

INSERT INTO "FaqEntry" ("id", "siteId", "question", "answer", "position", "updatedAt")
VALUES
    (
        'faq-ordering-closes',
        'site',
        $copy$When does ordering close?$copy$,
        $copy$Ordering closes 24 hours before that slot's delivery window starts. Morning (7–10am) locks at 7:00am the day before, afternoon (1–3pm) at 1:00pm, and evening (6–8pm) at 6:00pm.$copy$,
        0,
        CURRENT_TIMESTAMP
    ),
    (
        'faq-where-to-collect',
        'site',
        $copy$Where do I collect?$copy$,
        $copy$At a designated collection point inside the programme venue. You choose it at checkout.$copy$,
        1,
        CURRENT_TIMESTAMP
    ),
    (
        'faq-refunds',
        'site',
        $copy$What about refunds?$copy$,
        $copy$Cancellations made after payment are generally non-refundable. For payment-related issues or refund enquiries, please contact our support team for assistance.$copy$,
        2,
        CURRENT_TIMESTAMP
    ),
    (
        'faq-group-order',
        'site',
        $copy$Can I order for a group?$copy$,
        $copy$Yes. Checkout asks how many people the order feeds, and you can put a family or department name on it.$copy$,
        3,
        CURRENT_TIMESTAMP
    )
ON CONFLICT ("id") DO NOTHING;
