-- Portion label frozen on the order line. Existing rows stay null and keep rendering from nameSnapshot.
ALTER TABLE "OrderItem" ADD COLUMN "variantLabelSnapshot" TEXT;
