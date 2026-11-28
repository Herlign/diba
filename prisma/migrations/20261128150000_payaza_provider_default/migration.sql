-- New payments default to Payaza. Existing rows keep their provider value.
ALTER TABLE "Payment" ALTER COLUMN "provider" SET DEFAULT 'PAYAZA';
