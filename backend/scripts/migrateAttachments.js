// backend/scripts/migrateAttachments.js

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Migrate JSON attachments to relational tables
 */
async function migrateAttachments() {
  console.log("🔄 Starting attachment migration...\n");

  try {
    // ============================================
    // 1. MIGRATE EMAIL BROADCAST ATTACHMENTS
    // ============================================
    console.log("📧 Migrating email broadcast attachments...");

    const emailCampaigns = await prisma.emailBroadcastCampaign.findMany({
      where: {
        OR: [{ inline_image: { not: null } }, { attachments: { not: null } }],
      },
    });

    let emailMigrated = 0;

    for (const campaign of emailCampaigns) {
      const attachmentsToCreate = [];

      // Migrate inline_image
      if (campaign.inline_image && typeof campaign.inline_image === "object") {
        const img = campaign.inline_image;
        if (img.filename) {
          attachmentsToCreate.push({
            campaign_id: campaign.campaign_id,
            file_type: "INLINE",
            storage_key: img.filename,
            original_name: img.filename,
            mime_type: img.contentType || "image/jpeg",
            file_size: img.size || 0,
          });
        }
      }

      // Migrate attachments array
      if (Array.isArray(campaign.attachments)) {
        for (const att of campaign.attachments) {
          if (att.filename) {
            attachmentsToCreate.push({
              campaign_id: campaign.campaign_id,
              file_type: "ATTACHMENT",
              storage_key: att.filename,
              original_name: att.filename,
              mime_type: att.contentType || "application/octet-stream",
              file_size: att.size || 0,
            });
          }
        }
      }

      // Create attachments
      if (attachmentsToCreate.length > 0) {
        await prisma.emailBroadcastAttachment.createMany({
          data: attachmentsToCreate,
          skipDuplicates: true,
        });
        emailMigrated += attachmentsToCreate.length;
      }
    }

    console.log(
      ` Migrated ${emailMigrated} email attachments from ${emailCampaigns.length} campaigns\n`,
    );

    // ============================================
    // 2. MIGRATE IN-APP BROADCAST ATTACHMENTS
    // ============================================
    console.log("📱 Migrating in-app broadcast attachments...");

    const inappCampaigns = await prisma.broadcastCampaign.findMany({
      where: {
        attachments: { not: null },
      },
    });

    let inappMigrated = 0;

    for (const campaign of inappCampaigns) {
      if (!Array.isArray(campaign.attachments)) continue;

      const attachmentsToCreate = [];

      for (const att of campaign.attachments) {
        if (att.type === "link") {
          // Link attachment
          attachmentsToCreate.push({
            campaign_id: campaign.campaign_id,
            attachment_type: "LINK",
            link_url: att.url,
            link_label: att.label || null,
          });
        } else if (att.type === "image" || att.type === "video") {
          // File attachment
          const filename = att.url ? att.url.split("/").pop() : null;
          if (filename) {
            attachmentsToCreate.push({
              campaign_id: campaign.campaign_id,
              attachment_type: att.type.toUpperCase(),
              storage_key: filename,
              original_name: filename,
              mime_type: att.type === "image" ? "image/jpeg" : "video/mp4",
              file_size: 0, // Unknown, can be updated later
            });
          }
        }
      }

      // Create attachments
      if (attachmentsToCreate.length > 0) {
        await prisma.broadcastAttachment.createMany({
          data: attachmentsToCreate,
          skipDuplicates: true,
        });
        inappMigrated += attachmentsToCreate.length;
      }
    }

    console.log(
      ` Migrated ${inappMigrated} in-app attachments from ${inappCampaigns.length} campaigns\n`,
    );

    console.log("🎉 Migration completed successfully!");
    console.log("\n⚠️  NEXT STEPS:");
    console.log("1. Verify migrated data in database");
    console.log("2. Update service layer to use new tables");
    console.log("3. Deploy updated code");
    console.log("4. Remove deprecated JSON columns in future migration\n");
  } catch (error) {
    console.error(" Migration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateAttachments().catch((err) => {
  console.error(err);
  process.exit(1);
});
