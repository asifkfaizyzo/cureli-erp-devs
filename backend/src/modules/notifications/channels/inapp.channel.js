// ============================================
// IN-APP NOTIFICATION CHANNEL (STUB) backend\src\modules\notifications\channels\inapp.channel.js
// ============================================

/**
 * Send notifications via in-app channel
 * 
 * STUB: This will store notifications in database for frontend to fetch
 * 
 * @param {string} eventType - Notification event type
 * @param {Array} recipients - Array of recipient objects
 * @param {Object} context - Event context data
 * @returns {Promise<{sent: number, failed: number}>}
 */
export async function sendViaInApp(eventType, recipients, context) {
  // TODO: Implement when in-app notifications are needed
  // 
  // Implementation will:
  // 1. Create Notification records in database
  // 2. Optionally trigger WebSocket/SSE push
  // 
  // Schema needed:
  // model Notification {
  //   id           String   @id @default(uuid())
  //   user_id      String?
  //   cadmin_id    String?
  //   event_type   String
  //   title        String
  //   message      String
  //   data         Json?
  //   is_read      Boolean  @default(false)
  //   created_at   DateTime @default(now())
  // }

  console.log(`[InApp Channel] STUB: Would send ${eventType} to ${recipients.length} recipients`);

  return {
    sent: 0,
    failed: 0,
    stub: true,
    message: 'In-app notifications not yet implemented',
  };
}

export default { sendViaInApp };