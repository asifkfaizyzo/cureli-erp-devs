import prisma from "../../config/prisma.js";

/**
 * Update shop basic info (business_name, address_line_1, address_line_2, city, state, pincode)
 * Also advances user's onboarding_step to at least 5.
 *
 * user_id: the ID of the user making the change (from req.user.user_id)
 * data: validated payload
 */
export async function updateShopInfo(user_id, data) {
  const user = await prisma.user.findUnique({ where: { user_id } });
  if (!user) {
    const err = new Error("User not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (!user.shop_id) {
    const err = new Error("Shop not found for user");
    err.code = "NO_SHOP";
    throw err;
  }

  await prisma.shop.update({
    where: { shop_id: user.shop_id },
    data: {
      business_name: data.business_name,
      legal_name: data.legal_name || null,
      address_line_1: data.address_line_1,
      address_line_2: data.address_line_2 || null,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
    },
  });

  // Advance onboarding_step to 5 if it's less than 5
  if ((user.onboarding_step || 4) < 5) {
    await prisma.user.update({
      where: { user_id },
      data: { onboarding_step: 5 },
    });
  }

  return true;
}

/**
 * Update GST + business type and advance onboarding_step to 6 if needed.
 */
export async function updateShopGst(user_id, data) {
  const user = await prisma.user.findUnique({ where: { user_id } });
  if (!user) {
    const err = new Error("User not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (!user.shop_id) {
    const err = new Error("Shop not found for user");
    err.code = "NO_SHOP";
    throw err;
  }

  await prisma.shop.update({
    where: { shop_id: user.shop_id },
    data: {
      gst_number: data.gst_number || null,
      business_type: data.business_type || null,
      legal_name: data.legal_name || undefined,
    },
  });

  // Advance onboarding_step to 6 if it's less than 6
  if ((user.onboarding_step || 4) < 6) {
    await prisma.user.update({
      where: { user_id },
      data: { onboarding_step: 6 },
    });
  }

  return true;
}
