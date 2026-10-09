-- Which device frame a product screenshot is shown in (WEB, TABLET or PHONE); empty = by its shape.
ALTER TABLE "OfferingMedia" ADD COLUMN IF NOT EXISTS "device" TEXT;
