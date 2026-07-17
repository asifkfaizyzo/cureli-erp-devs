generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}





model User {
  user_id                        String                      @id @default(uuid()) @db.Uuid
  shop_id                        String?                     @db.Uuid
  branch_id                      String?                     @db.Uuid
  first_name                     String
  last_name                      String
  full_name                      String
  username                       String?                     @unique
  email                          String?                     @unique
  phone_number                   String?
  password_hash                  String?
  google_id                      String?                     @unique
  login_provider                 String
  role                           String
  is_active                      Boolean                     @default(true)
  last_login_at                  DateTime?                   @db.Timestamptz(6)
  created_at                     DateTime                    @default(now()) @db.Timestamptz(6)
  updated_at                     DateTime                    @updatedAt @db.Timestamptz(6)
  status                         String                      @default("pending_setup")
  first_login_after_verification Boolean                     @default(false)
  onboarding_step                Int                         @default(4)
  reset_token                    String?                     @db.VarChar(500)
  reset_token_expires            DateTime?                   @db.Timestamptz(6)
  deleted_at                     DateTime?                   @db.Timestamptz(6)
  
  // Login OTP fields
  login_otp_hash                 String?                     // ← ADD THIS LINE
  login_otp_expires              DateTime?                   @db.Timestamptz(6)
  login_otp_attempts             Int                         @default(0)
  
  first_verified_at              DateTime?                   @db.Timestamptz(6)
  
  // Email change fields
  email_change_expires           DateTime?                   @db.Timestamptz(6)
  email_change_new_email         String?
  email_change_otp_hash          String?
  
  // Phone change fields
  phone_change_expires           DateTime?                   @db.Timestamptz(6)
  phone_change_new_number        String?
  phone_change_old_verified      Boolean                     @default(false)
  phone_change_otp_hash          String?

  // OTP security
  otp_cycle_failures             Int                         @default(0)
  otp_locked_until               DateTime?
  otp_trusted_until              DateTime?                   @db.Timestamptz(6)  
  // Relations
  activityLogs                   ActivityLog[]
  creditApplications             CreditApplication[]         @relation("CreditApplicationsBy")
  customerCreditApplications     CustomerCreditApplication[] @relation("CustomerCreditApplicationsBy")
  customersCreated               Customer[]                  @relation("CustomerCreator")
  medicinesCreated               Medicine[]                  @relation("MedicineCreator")
  notifications                  Notification[]              @relation("UserNotifications")
  returnsApproved                PurchaseInvoice[]           @relation("ReturnApprover")
  purchaseInvoicesConfirmed      PurchaseInvoice[]           @relation("PurchaseInvoiceConfirmer")
  purchaseInvoicesCreated        PurchaseInvoice[]           @relation("PurchaseInvoiceCreator")
  returnsRejected                PurchaseInvoice[]           @relation("ReturnRejecter")
  purchasePayments               PurchasePayment[]           @relation("PaymentCreator")
  salesReturnsApproved           SalesInvoice[]              @relation("SalesReturnApprover")
  salesInvoicesCancelled         SalesInvoice[]              @relation("SalesInvoiceCanceller")
  salesInvoicesConfirmed         SalesInvoice[]              @relation("SalesInvoiceConfirmer")
  salesInvoicesCreated           SalesInvoice[]              @relation("SalesInvoiceCreator")
  salesReturnsRejected           SalesInvoice[]              @relation("SalesReturnRejecter")
  salesPaymentsCreated           SalesPayment[]              @relation("SalesPaymentCreator")
  shopFiles                      ShopFile[]
  shops_owned                    Shop[]                      @relation("OwnerOfShop")
  adjustmentsApproved            StockAdjustment[]           @relation("AdjustmentApprover")
  adjustmentsCreated             StockAdjustment[]           @relation("AdjustmentCreator")
  stockLedgerEntries             StockLedger[]               @relation("StockLedgerCreator")
  suppliersCreated               Supplier[]                  @relation("SupplierCreator")
  ticketsCancelled               Ticket[]                    @relation("TicketCanceller")
  ticketsCreated                 Ticket[]                    @relation("TicketCreator")
  ticketsReopened                Ticket[]                    @relation("TicketReopener")
  sessions                       UserSession[]
  branch                         Branch?                     @relation(fields: [branch_id], references: [branch_id])
  shop                           Shop?                       @relation("UsersInShop", fields: [shop_id], references: [shop_id])
  inventoryImportsCreated InventoryImportJob[] @relation("InventoryImportCreator")

  @@map("users")
}

model UserSession {
  id             String    @id @default(uuid()) @db.Uuid
  user_id        String    @db.Uuid
  session_token  String    @unique
  device_info    String?
  ip_address     String?
  is_active      Boolean   @default(true)
  created_at     DateTime  @default(now()) @db.Timestamptz(6)
  last_active_at DateTime  @default(now()) @db.Timestamptz(6)
  expires_at     DateTime  @db.Timestamptz(6)
  ended_at       DateTime? @db.Timestamptz(6)
  ended_reason   String?
  user           User      @relation(fields: [user_id], references: [user_id], onDelete: Cascade)

  @@index([user_id])
  @@index([session_token])
  @@index([is_active])
  @@index([expires_at])
  @@map("user_sessions")
}







// ════════════════════════════════════════════════════════════════════════════════════════════════════════════
// SHOP
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════

model Shop {
  shop_id                 String               @id @default(uuid()) @db.Uuid
  owner_user_id           String               @db.Uuid
  business_name           String
  legal_name              String?
  gst_number              String?              @unique
  business_type           String?
  address_line_1          String
  address_line_2          String?
  city                    String
  state                   String
  pincode                 String
  verification_status     String               @default("pending")
  verification_notes      String?
  current_subscription_id String?              @unique @db.Uuid
  created_at              DateTime             @default(now()) @db.Timestamptz(6)
  updated_at              DateTime             @updatedAt @db.Timestamptz(6)
  is_active               Boolean              @default(true)
  branches                Branch[]
  customerCredits         CustomerCredit[]     @relation("ShopCustomerCredits")
  customers               Customer[]           @relation("ShopCustomers")
  inventory               Inventory[]          @relation("ShopInventory")
  medicines               Medicine[]           @relation("ShopMedicines")
  paymentTransactions     PaymentTransaction[] @relation("ShopPayments")
  customPlans             Plan[]               @relation("CustomPlanShop")
  purchaseInvoices        PurchaseInvoice[]    @relation("ShopPurchaseInvoices")
  purchasePayments        PurchasePayment[]    @relation("ShopPurchasePayments")
  salesInvoices           SalesInvoice[]       @relation("ShopSalesInvoices")
  shopFiles               ShopFile[]
  subscriptions           ShopSubscription[]   @relation("ShopSubscriptions")
  currentSubscription     ShopSubscription?    @relation("CurrentSubscription", fields: [current_subscription_id], references: [subscription_id])
  owner                   User                 @relation("OwnerOfShop", fields: [owner_user_id], references: [user_id])
  stockAdjustments        StockAdjustment[]    @relation("ShopStockAdjustments")
  stockLedger             StockLedger[]        @relation("ShopStockLedger")
  supplierCredits         SupplierCredit[]     @relation("ShopSupplierCredits")
  suppliers               Supplier[]           @relation("ShopSuppliers")
  tickets                 Ticket[]             @relation("ShopTickets")
  users                   User[]               @relation("UsersInShop")
  marketplaceListings     MarketplaceListing[]       @relation("ShopMarketplaceListings")
  categoryVisibility      BranchCategoryVisibility[] @relation("ShopCategoryVisibility")
  marketplaceOrders       MarketplaceOrder[]         @relation("ShopMarketplaceOrders")
  marketplaceProfile      MarketplaceProfile?
  inventoryImportJobs  InventoryImportJob[] @relation("ShopInventoryImportJobs")

  @@map("shops")
}

model Branch {
  branch_id        String            @id @default(uuid()) @db.Uuid
  shop_id          String            @db.Uuid
  branch_name      String
  branch_type      String            @default("main")
  address_line_1   String?
  address_line_2   String?
  city             String?
  state            String?
  pincode          String?
  contact_number   String?
  alternate_number String?
  is_active        Boolean           @default(true)
  created_at       DateTime          @default(now()) @db.Timestamptz(6)
  updated_at       DateTime          @updatedAt @db.Timestamptz(6)

  shop             Shop              @relation(fields: [shop_id], references: [shop_id])
  suppliers        SupplierBranch[]  @relation("BranchSuppliers")
  customerCredits  CustomerCredit[]  @relation("BranchCustomerCredits")
  customers        Customer[]        @relation("BranchCustomers")
  inventory        Inventory[]       @relation("BranchInventory")
  medicines        Medicine[]        @relation("BranchMedicines")
  purchaseInvoices PurchaseInvoice[] @relation("BranchPurchaseInvoices")
  salesInvoices    SalesInvoice[]    @relation("BranchSalesInvoices")
  stockAdjustments StockAdjustment[] @relation("BranchStockAdjustments")
  stockLedger      StockLedger[]     @relation("BranchStockLedger")
  tickets          Ticket[]          @relation("BranchTickets")
  marketplaceListings     MarketplaceListing[]       @relation("BranchMarketplaceListings")
  categoryVisibility      BranchCategoryVisibility[] @relation("BranchCategoryVisibility")
  marketplaceOrders       MarketplaceOrder[]         @relation("BranchMarketplaceOrders")
  inventoryImportJobs     InventoryImportJob[]       @relation("BranchInventoryImportJobs")
  users                   User[]
  marketplaceSettings     BranchMarketplaceSettings?

  // ── NEW RELATION ──────────────────────────────────────────
  checkoutSessions        CheckoutSession[]           @relation("BranchCheckoutSessions")
  // ─────────────────────────────────────────────────────────

  @@map("branches")
}







// ════════════════════════════════════════════════════════════════════════════════════════════════════════════
// MEDICINE CATALOG (Global Medicine Database)
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════

//cureli master catalog
model MasterMedicine {
  master_medicine_id String   @id @default(uuid()) @db.Uuid
  
  // Core identifiers
  master_key         String   @unique @db.VarChar(500)  //  NEW: "fluoxetine_capsule"
  generic_name       String   @db.VarChar(500)          //  NEW: "Fluoxetine Capsule"
  
  // Medicine properties
  type               MedicineType
  form               String?  @db.VarChar(50)           //  NEW: "Capsule", "Tablet"
  composition        Json                                //  CHANGED: String → Json (structured)
  
  // Regulatory
  prescription_required Boolean @default(false)
  primary_category   String?  @db.VarChar(100)          //  NEW: "DERMA", "CARDIO"
  
  // Metadata
  variant_count      Int      @default(0)                //  NEW: Number of variants
  image_status       String   @default("NONE") @db.VarChar(10)  
  is_active          Boolean  @default(true)
  created_at         DateTime @default(now()) @db.Timestamptz(6)
  updated_at         DateTime @updatedAt @db.Timestamptz(6)
  
  // Relations
  variants           MasterMedicineVariant[]             //  NEW: One-to-many
  images             MasterMedicineImage[]
  linkedMedicines    Medicine[]              @relation("MedicineMasterLink")
  // Indexes
  @@index([master_key])
  @@index([generic_name])
  @@index([type])
  @@index([form])
  @@index([is_active])
  @@index([primary_category])
  @@index([image_status])
  @@map("master_medicines")
}

model MasterMedicineVariant {
  variant_id         String   @id @default(uuid()) @db.Uuid
  master_medicine_id String   @db.Uuid
  
  // CCSP identifiers
  sku_id             String   @unique @db.VarChar(50)    // "10005", "10010"
  
  // Product details
  name               String   @db.VarChar(500)           // "Topinate Cream"
  brand              String?  @db.VarChar(350)           // "Topinate"
  
  // Composition (with strengths)
  composition        Json                                 // [{ name, strength }]
  
  // Strength (parsed)
  strength_value     Float?
  strength_unit      String?  @db.VarChar(20)            // "mg", "%"
  
  // Business info
  manufacturer       String?  @db.VarChar(200)
  marketer           String?  @db.VarChar(200)
  pack_size          String?  @db.VarChar(100)
  
  // Pricing
  mrp                Decimal? @db.Decimal(10, 2)
  selling_price      Decimal? @db.Decimal(10, 2)
  discount_percent   Float?
  
  // Additional
  description        String?  @db.Text
  
  // Images (JSON array of URLs)
  images             Json     @default("[]")             // ["img_00_high.jpg", ...]
  
  // Metadata
  created_at         DateTime @default(now()) @db.Timestamptz(6)
  updated_at         DateTime @updatedAt @db.Timestamptz(6)
  
  // Relations
  master             MasterMedicine @relation(fields: [master_medicine_id], references: [master_medicine_id], onDelete: Cascade)
  linkedMedicines  Medicine[] @relation("MedicineVariantLink")
  marketplaceListings     MarketplaceListing[]       @relation("VariantMarketplaceListings")
  marketplaceOrderItems   MarketplaceOrderItem[]     @relation("VariantOrderItems")
  // Indexes
  @@index([master_medicine_id])
  @@index([sku_id])
  @@index([brand])
  @@index([name])
  @@index([manufacturer])
  @@index([marketer])
  @@map("master_medicine_variants")
}

model MasterMedicineImage {
  image_id           String   @id @default(uuid()) @db.Uuid
  master_medicine_id String   @db.Uuid
  
  // Image info
  sku_id             String   @db.VarChar(50)           //  NEW: Which variant this belongs to
  url                String   @db.VarChar(500)          // "/static/medicine_images/10005/img_00_high.jpg"
  type               ImageType                          // PRIMARY or GALLERY
  sequence           Int      @default(0)               //  NEW: Display order
  source             ImageSource @default(SCRAPED)
  uploaded_by        String?     @db.VarChar(100)
  created_at         DateTime @default(now()) @db.Timestamptz(6)
  
  // Relations
  medicine           MasterMedicine @relation(fields: [master_medicine_id], references: [master_medicine_id], onDelete: Cascade)
  
  // Indexes
  @@index([master_medicine_id])
  @@index([sku_id])
  @@index([type])
  @@map("master_medicine_images")
}

//erp shop medicine list
model Medicine {
  // ═══════════════════════════════════════════════════════
  // SCALAR FIELDS - ALL FIRST
  // ═══════════════════════════════════════════════════════
  medicine_id            String    @id @default(uuid()) @db.Uuid
  name                   String    @db.VarChar(200)
  generic_name           String?   @db.VarChar(200)
  manufacturer           String    @db.VarChar(150)
  category               String?   @db.VarChar(100)
  sub_category           String?   @db.VarChar(100)
  schedule               String?   @db.VarChar(50)
  hsn_code               String?   @db.VarChar(20)
  pack_size              String?   @db.VarChar(50)
  unit_of_measure        String    @default("UNIT")
  gst_percentage         Decimal   @default(12) @db.Decimal(5, 2)
  cgst_percentage        Decimal   @default(6) @db.Decimal(5, 2)
  sgst_percentage        Decimal   @default(6) @db.Decimal(5, 2)
  rack_no                String?   @db.VarChar(20)
  is_active              Boolean   @default(true)
  is_discontinued        Boolean   @default(false)
  shop_id                String    @db.Uuid
  created_by             String    @db.Uuid
  created_at             DateTime  @default(now()) @db.Timestamptz(6)
  updated_at             DateTime  @updatedAt @db.Timestamptz(6)
  branch_id              String?   @db.Uuid
  max_stock_level        Decimal?  @db.Decimal(10, 2)
  min_stock_level        Decimal?  @db.Decimal(10, 2)
  reorder_point          Decimal?  @db.Decimal(10, 2)
  master_medicine_id     String?   @db.Uuid
  // ── VARIANT LINKING (the correct link target) ──
  linked_variant_id      String?   @db.Uuid          //  NEW: links to specific variant
  linked_variant_sku     String?   @db.VarChar(50)   //  NEW: denormalized for fast lookup
  link_status            LinkStatus @default(PENDING)
  link_confidence_score  Float?
  link_rejected          Boolean   @default(false)
  linked_at              DateTime? @db.Timestamptz(6)
  linked_by_id           String?   @db.Uuid
  linked_by_type         String?   @db.VarChar(20)
  suggested_master_id    String?   @db.Uuid
  suggested_variant_id   String?   @db.Uuid
  suggestion_reason      String?   @db.VarChar(200)
  normalized_name        String?   @db.VarChar(200)

  // ═══════════════════════════════════════════════════════
  // RELATIONS - ALL AFTER SCALARS
  // ═══════════════════════════════════════════════════════
  masterMedicine   MasterMedicine?       @relation("MedicineMasterLink", fields: [master_medicine_id], references: [master_medicine_id])
  inventory        Inventory[]           @relation("MedicineInventory")
  branch           Branch?               @relation("BranchMedicines", fields: [branch_id], references: [branch_id])
  creator          User                  @relation("MedicineCreator", fields: [created_by], references: [user_id])
  shop             Shop                  @relation("ShopMedicines", fields: [shop_id], references: [shop_id], onDelete: Cascade)
  purchaseItems    PurchaseInvoiceItem[] @relation("PurchaseLineItems")
  salesItems       SalesInvoiceItem[]    @relation("SalesMedicineItems")
  stockAdjustments StockAdjustment[]     @relation("MedicineStockAdjustments")
  stockLedger      StockLedger[]         @relation("MedicineStockLedger")
  linkedVariant    MasterMedicineVariant? @relation("MedicineVariantLink", fields: [linked_variant_id], references: [variant_id])
  marketplaceListings     MarketplaceListing[]        @relation("MedicineMarketplaceListing")
  marketplaceOrderItems   MarketplaceOrderItem[]     @relation("MedicineOrderItems")
  // ═══════════════════════════════════════════════════════
  // INDEXES & CONSTRAINTS - LAST
  // ═══════════════════════════════════════════════════════
  @@unique([shop_id, branch_id, name, manufacturer])
  @@index([shop_id, branch_id, is_active])
  @@index([shop_id, is_active])
  @@index([shop_id, name])
  @@index([hsn_code])
  @@index([manufacturer])
  @@index([master_medicine_id, link_status])
  @@map("medicines")
}

//erp shop inventory
model Inventory {
  inventory_id       String                @id @default(uuid()) @db.Uuid
  shop_id            String                @db.Uuid
  branch_id          String?               @db.Uuid
  medicine_id        String                @db.Uuid
  batch_number       String                @db.VarChar(50)
  expiry_date        DateTime              @db.Date
  manufacturing_date DateTime?             @db.Date
  current_stock      Decimal               @default(0) @db.Decimal(10, 2)
  reserved_stock     Decimal               @default(0) @db.Decimal(10, 2)
  available_stock    Decimal               @default(0) @db.Decimal(10, 2)
  minimum_stock      Decimal?              @db.Decimal(10, 2)
  last_purchase_rate Decimal?              @db.Decimal(10, 2)
  last_purchase_date DateTime?             @db.Date
  mrp                Decimal               @db.Decimal(10, 2)
  selling_rate       Decimal?              @db.Decimal(10, 2)
  rack_no            String?               @db.VarChar(20)
  is_active          Boolean               @default(true)
  is_expired         Boolean               @default(false)
  source              InventorySource       @default(MANUAL)
  import_job_id   String?          @db.Uuid
  created_at         DateTime              @default(now()) @db.Timestamptz(6)
  updated_at         DateTime              @updatedAt @db.Timestamptz(6)
  branch             Branch?               @relation("BranchInventory", fields: [branch_id], references: [branch_id])
  medicine           Medicine              @relation("MedicineInventory", fields: [medicine_id], references: [medicine_id])
  shop               Shop                  @relation("ShopInventory", fields: [shop_id], references: [shop_id], onDelete: Cascade)
  purchaseItems      PurchaseInvoiceItem[] @relation("PurchaseItemInventory")
  salesItems         SalesInvoiceItem[]    @relation("SalesInventoryItems")
  adjustments        StockAdjustment[]     @relation("InventoryAdjustments")
  stockMovements     StockLedger[]         @relation("InventoryStockMovements")
  

  @@unique([shop_id, medicine_id, batch_number, branch_id])
  @@index([shop_id, medicine_id])
  @@index([batch_number])
  @@index([expiry_date])
  @@index([import_job_id])
  @@index([source])
  @@index([shop_id, current_stock])
  @@index([is_expired])
  @@map("inventory")
}

model InventoryImportJob {
  import_job_id         String          @id @default(uuid()) @db.Uuid
  shop_id               String          @db.Uuid
  branch_id             String          @db.Uuid
  created_by            String          @db.Uuid
  original_file_name    String          @db.VarChar(255)
  storage_key           String          @db.VarChar(500)
  file_size             Int
  file_hash             String          @db.VarChar(64)
  status                ImportJobStatus @default(PENDING)
  processing_phase      String?         @db.VarChar(50)
  processing_progress   Int             @default(0)
  column_mapping        Json?
  detected_software     String?         @db.VarChar(100)
  resolutions           Json?
  conflict_decisions    Json?
  total_rows              Int   @default(0)
  valid_rows              Int   @default(0)
  imported_rows           Int   @default(0)
  skipped_rows            Int   @default(0)
  error_rows              Int   @default(0)
  new_medicines_created   Int   @default(0)
  existing_batches_merged Int   @default(0)
  parsed_row_count        Int?
  error_log             Json?
  created_at            DateTime        @default(now()) @db.Timestamptz(6)
  updated_at            DateTime        @updatedAt @db.Timestamptz(6)
  parsing_started_at    DateTime?       @db.Timestamptz(6)
  parsing_completed_at  DateTime?       @db.Timestamptz(6)
  confirmed_at          DateTime?       @db.Timestamptz(6)
  completed_at          DateTime?       @db.Timestamptz(6)
  cancelled_at          DateTime?       @db.Timestamptz(6)
  expires_at            DateTime?       @db.Timestamptz(6)

  shop    Shop   @relation("ShopInventoryImportJobs", fields: [shop_id], references: [shop_id], onDelete: Cascade)
  branch  Branch @relation("BranchInventoryImportJobs", fields: [branch_id], references: [branch_id], onDelete: Cascade)
  creator User   @relation("InventoryImportCreator", fields: [created_by], references: [user_id])

  @@index([shop_id, status, created_at(sort: Desc)])
  @@index([branch_id, status])
  @@index([created_by])
  @@index([file_hash, shop_id])
  @@index([status, expires_at])
  @@index([created_at(sort: Desc)])
  @@map("inventory_import_jobs")
}



// ════════════════════════════════════════════════════════════════════════════════════════════════════════════
// PHARMACY MARKETPLACE
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════

model MarketplaceProfile {
  marketplace_profile_id String            @id @default(uuid()) @db.Uuid
  shop_id                String            @unique @db.Uuid
  
  // Storefront Identity
  storefront_name        String?           @db.VarChar(200)
  storefront_description String?           @db.Text
  support_phone          String?           @db.VarChar(20)
  logo_url               String?           @db.VarChar(500)
  banner_url             String?           @db.VarChar(500)

  // Lifecycle
  marketplace_status     MarketplaceStatus @default(NOT_STARTED)
  onboarding_completed   Boolean           @default(false)
  is_live                Boolean           @default(false)
  
  // Draft Persistence
  onboarding_draft       Json?             // { currentStep, storefrontData, branchSelection }

  created_at             DateTime          @default(now()) @db.Timestamptz(6)
  updated_at             DateTime          @updatedAt @db.Timestamptz(6)

  // Relations
  shop                   Shop              @relation(fields: [shop_id], references: [shop_id], onDelete: Cascade)
  branchSettings         BranchMarketplaceSettings[]

  @@index([shop_id])
  @@index([marketplace_status])
  @@map("marketplace_profiles")
}

model BranchMarketplaceSettings {
  branch_marketplace_id  String   @id @default(uuid()) @db.Uuid
  branch_id              String   @unique @db.Uuid
  marketplace_profile_id String   @db.Uuid

  marketplace_enabled    Boolean  @default(false)
  shop_image_url         String?  @db.VarChar(500)

  // Geolocation
  latitude               Decimal? @db.Decimal(10, 8)
  longitude              Decimal? @db.Decimal(11, 8)
  google_place_id        String?  @db.VarChar(500)
  formatted_address      String?  @db.VarChar(500)

  // Timings
  opening_time           String?  @db.VarChar(5) // "09:00"
  closing_time           String?  @db.VarChar(5) // "21:00"
  is_24_hours            Boolean  @default(false)

  // Fulfillment
  pickup_enabled         Boolean  @default(false)
  delivery_enabled       Boolean  @default(false)
  contact_override       String?  @db.VarChar(20)

  created_at             DateTime @default(now()) @db.Timestamptz(6)
  updated_at             DateTime @updatedAt @db.Timestamptz(6)

  // Relations
  branch                 Branch             @relation(fields: [branch_id], references: [branch_id], onDelete: Cascade)
  marketplaceProfile     MarketplaceProfile @relation(fields: [marketplace_profile_id], references: [marketplace_profile_id], onDelete: Cascade)

  @@index([marketplace_profile_id])
  @@index([branch_id])
  @@map("branch_marketplace_settings")
}

model MarketplaceListing {
  listing_id            String                 @id @default(uuid()) @db.Uuid
  shop_id               String                 @db.Uuid
  branch_id             String                 @db.Uuid
  medicine_id           String                 @db.Uuid
  linked_variant_id     String                 @db.Uuid

  is_visible            Boolean                @default(false)
  stock_status          MarketplaceStockStatus @default(IN_STOCK)
  marketplace_price     Decimal?               @db.Decimal(10, 2)
  requires_prescription Boolean                @default(false)   // ← ADD THIS

  created_at            DateTime               @default(now()) @db.Timestamptz(6)
  updated_at            DateTime               @updatedAt @db.Timestamptz(6)

  shop                  Shop                   @relation("ShopMarketplaceListings", fields: [shop_id], references: [shop_id], onDelete: Cascade)
  branch                Branch                 @relation("BranchMarketplaceListings", fields: [branch_id], references: [branch_id], onDelete: Cascade)
  medicine              Medicine               @relation("MedicineMarketplaceListing", fields: [medicine_id], references: [medicine_id], onDelete: Cascade)
  linkedVariant         MasterMedicineVariant  @relation("VariantMarketplaceListings", fields: [linked_variant_id], references: [variant_id])
  orderItems              MarketplaceOrderItem[]     @relation("ListingOrderItems")
  @@unique([medicine_id, branch_id])
  @@index([shop_id, branch_id])
  @@index([branch_id, is_visible])
  @@index([linked_variant_id])
  @@index([shop_id, branch_id, is_visible, stock_status])
  @@map("marketplace_listings")
}

model BranchCategoryVisibility {
  id            String   @id @default(uuid()) @db.Uuid
  branch_id     String   @db.Uuid
  shop_id       String   @db.Uuid
  category_name String   @db.VarChar(150)
  is_enabled    Boolean  @default(true)

  created_at    DateTime @default(now()) @db.Timestamptz(6)
  updated_at    DateTime @updatedAt @db.Timestamptz(6)

  branch        Branch   @relation("BranchCategoryVisibility", fields: [branch_id], references: [branch_id], onDelete: Cascade)
  shop          Shop     @relation("ShopCategoryVisibility", fields: [shop_id], references: [shop_id], onDelete: Cascade)

  @@unique([branch_id, category_name])
  @@index([branch_id])
  @@index([shop_id, branch_id])
  @@map("branch_category_visibility")
}

model CheckoutSession {
  session_id    String   @id @default(uuid()) @db.Uuid
  customer_id   String   @db.Uuid
  branch_id     String   @db.Uuid

  razorpay_order_id          String   @unique @db.VarChar(100)

  cart_snapshot              Json
  delivery_address_id        String?  @db.Uuid
  delivery_address_snapshot  Json

  subtotal        Decimal  @db.Decimal(10, 2)
  service_charge  Decimal  @db.Decimal(10, 2)
  delivery_fee    Decimal  @db.Decimal(10, 2)
  km_surcharge    Decimal  @db.Decimal(10, 2)
  tip             Decimal  @default(0) @db.Decimal(10, 2)
  grand_total     Decimal  @db.Decimal(10, 2)
  distance_km     Decimal  @db.Decimal(10, 2)

  prescription_files  Json  @default("[]")

  // ── Patient (who the medicine is for) ─────────────────────────
  patient_is_self         Boolean  @default(true)
  patient_name_snapshot   String?  @db.VarChar(200)
  patient_age_snapshot    Int?
  patient_sex_snapshot    String?  @db.VarChar(10)

  status      String    @default("created") @db.VarChar(20)
  expires_at  DateTime  @db.Timestamptz(6)
  created_at  DateTime  @default(now()) @db.Timestamptz(6)
  paid_at     DateTime? @db.Timestamptz(6)

  order_id    String?  @unique @db.Uuid


  customer    CureliMobileUser   @relation("CustomerCheckoutSessions", fields: [customer_id], references: [id], onDelete: Restrict)
  branch      Branch             @relation("BranchCheckoutSessions", fields: [branch_id], references: [branch_id], onDelete: Restrict)
  order       MarketplaceOrder?  @relation("SessionOrder", fields: [order_id], references: [order_id], onDelete: SetNull)

  @@index([customer_id, status])
  @@index([razorpay_order_id])
  @@index([status, expires_at])
  @@map("checkout_sessions")
}

model DeliveryPricingConfig {
  config_id   String   @id @default(uuid()) @db.Uuid
  version     Int      @default(1)

  service_tier_1_max    Decimal  @default(999.99)  @db.Decimal(10, 2)
  service_tier_1_charge Decimal  @default(20)      @db.Decimal(10, 2)
  service_tier_2_max    Decimal  @default(1999.99) @db.Decimal(10, 2)
  service_tier_2_charge Decimal  @default(15)      @db.Decimal(10, 2)
  service_tier_3_charge Decimal  @default(0)       @db.Decimal(10, 2)

  delivery_tier_1_max    Decimal @default(299.99)  @db.Decimal(10, 2)
  delivery_tier_1_charge Decimal @default(60)      @db.Decimal(10, 2)
  delivery_tier_2_max    Decimal @default(999.99)  @db.Decimal(10, 2)
  delivery_tier_2_charge Decimal @default(50)      @db.Decimal(10, 2)
  delivery_tier_3_max    Decimal @default(1999.99) @db.Decimal(10, 2)
  delivery_tier_3_charge Decimal @default(40)      @db.Decimal(10, 2)
  delivery_tier_4_charge Decimal @default(30)      @db.Decimal(10, 2)

  free_km_radius      Decimal  @default(3.0)    @db.Decimal(10, 2)
  per_km_tier_1_max   Decimal  @default(999.99) @db.Decimal(10, 2)
  per_km_tier_1_rate  Decimal  @default(15)     @db.Decimal(10, 2)
  per_km_tier_2_rate  Decimal  @default(10)     @db.Decimal(10, 2)

  max_delivery_km     Decimal? @db.Decimal(10, 2)
  tip_enabled         Boolean  @default(true)

  updated_at  DateTime @default(now()) @updatedAt @db.Timestamptz(6)
  updated_by  String?  @db.Uuid

  @@map("delivery_pricing_config")
}

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════
// MARKETPLACE ORDERS
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════

model MarketplaceOrder {
  order_id                  String    @id @default(uuid()) @db.Uuid
  order_number              String    @unique @db.VarChar(20)

  shop_id                   String    @db.Uuid
  branch_id                 String    @db.Uuid
  customer_id               String    @db.Uuid

  delivery_address_id       String?   @db.Uuid
  delivery_address_snapshot Json

  customer_name_snapshot    String    @db.VarChar(200)
  customer_phone_snapshot   String    @db.VarChar(15)

  status                    MarketplaceOrderStatus @default(PLACED)

  payment_method            String    @default("COD") @db.VarChar(30)
  payment_status            String    @default("PENDING") @db.VarChar(30)

  subtotal                  Decimal   @db.Decimal(10, 2)
  total_amount              Decimal   @db.Decimal(10, 2)

  checkout_session_id       String?   @db.Uuid
  service_charge            Decimal   @default(0) @db.Decimal(10, 2)
  delivery_fee              Decimal   @default(0) @db.Decimal(10, 2)
  km_surcharge              Decimal   @default(0) @db.Decimal(10, 2)
  tip                       Decimal   @default(0) @db.Decimal(10, 2)
  distance_km               Decimal   @default(0) @db.Decimal(10, 2)
  razorpay_order_id         String?   @db.VarChar(100)
  razorpay_payment_id       String?   @db.VarChar(100)
  razorpay_signature        String?   @db.VarChar(500)

  requires_prescription     Boolean   @default(false)
  notes                     String?   @db.VarChar(500)
  patient_is_self         Boolean  @default(true)
  patient_name_snapshot   String?  @db.VarChar(200)
  patient_age_snapshot    Int?
  patient_sex_snapshot    String?  @db.VarChar(10)

  rejection_reason          String?   @db.VarChar(50)
  rejection_reason_other    String?   @db.VarChar(300)
  cancelled_by              String?   @db.VarChar(20)
  auto_completed            Boolean   @default(false)

  placed_at                 DateTime  @db.Timestamptz(6)
  accepted_at               DateTime? @db.Timestamptz(6)
  ready_at                  DateTime? @db.Timestamptz(6)
  completed_at              DateTime? @db.Timestamptz(6)
  rejected_at               DateTime? @db.Timestamptz(6)
  cancelled_at              DateTime? @db.Timestamptz(6)
  created_at                DateTime  @default(now()) @db.Timestamptz(6)
  updated_at                DateTime  @updatedAt @db.Timestamptz(6)

  shop                      Shop                           @relation("ShopMarketplaceOrders", fields: [shop_id], references: [shop_id], onDelete: Restrict)
  branch                    Branch                         @relation("BranchMarketplaceOrders", fields: [branch_id], references: [branch_id], onDelete: Restrict)
  customer                  CureliMobileUser               @relation("CustomerMarketplaceOrders", fields: [customer_id], references: [id], onDelete: Restrict)
  deliveryAddress           CureliMobileAddress?           @relation("OrderDeliveryAddress", fields: [delivery_address_id], references: [id], onDelete: SetNull)
  items                     MarketplaceOrderItem[]         @relation("OrderItems")
  prescriptions             MarketplaceOrderPrescription[] @relation("OrderPrescriptions")
  statusHistory             MarketplaceOrderStatusHistory[] @relation("OrderStatusHistory")

  checkoutSession           CheckoutSession?               @relation("SessionOrder")

  @@index([shop_id, status])
  @@index([customer_id, placed_at(sort: Desc)])
  @@index([branch_id, status, placed_at(sort: Desc)])
  @@index([shop_id, placed_at(sort: Desc)])
  @@index([status, ready_at])
  @@map("marketplace_orders")
}

model MarketplaceOrderItem {

  item_id                       String  @id @default(uuid()) @db.Uuid
  order_id                      String  @db.Uuid

  // ── Listing reference ─────────────────────────────────
  // listing_id is stored for traceability only.
  // It is NOT used for price or name lookups after order creation.
  // All financial data comes from the snapshots below.
  listing_id                    String  @db.Uuid

  // ── Denormalised FKs ──────────────────────────────────
  // Kept for future analytics and cross-referencing.
  // Do NOT join to these for order display — use snapshots.
  medicine_id                   String  @db.Uuid
  variant_id                    String  @db.Uuid

  // ── Snapshots (immutable after creation) ──────────────
  // Everything a pharmacy or customer needs to understand this line item
  // without joining to any other table.
  medicine_name_snapshot        String  @db.VarChar(500)
  variant_sku_snapshot          String  @db.VarChar(50)
  brand_snapshot                String? @db.VarChar(350)
  pack_size_snapshot            String? @db.VarChar(100)
  unit_price_snapshot           Decimal @db.Decimal(10, 2)
  mrp_snapshot                  Decimal @db.Decimal(10, 2)
  requires_prescription_snapshot Boolean

  // ── Quantity and total ────────────────────────────────
  quantity                      Int
  line_total                    Decimal @db.Decimal(10, 2)


  order                         MarketplaceOrder      @relation("OrderItems", fields: [order_id], references: [order_id], onDelete: Cascade)
  listing                       MarketplaceListing    @relation("ListingOrderItems", fields: [listing_id], references: [listing_id], onDelete: Restrict)
  medicine                      Medicine              @relation("MedicineOrderItems", fields: [medicine_id], references: [medicine_id], onDelete: Restrict)
  variant                       MasterMedicineVariant @relation("VariantOrderItems", fields: [variant_id], references: [variant_id], onDelete: Restrict)


  @@index([order_id])
  @@index([listing_id])
  @@index([medicine_id])
  @@index([variant_id])
  @@map("marketplace_order_items")
}

model MarketplaceOrderPrescription {

  prescription_id   String    @id @default(uuid()) @db.Uuid
  order_id          String    @db.Uuid

  // ── S3 storage ────────────────────────────────────────
  storage_key       String    @db.VarChar(500)
  original_name     String    @db.VarChar(255)
  mime_type         String    @db.VarChar(100)
  file_size         Int

  // ── Display order ─────────────────────────────────────
  sequence          Int       @default(0)

  // ── Expiry and soft-delete ────────────────────────────
  // expires_at: set atomically when order reaches terminal state
  //   COMPLETED / REJECTED → now + 10 days
  //   CANCELLED            → now + 1 day
  // deleted_at: set by cron after S3 file is purged
  //   DB row is kept for audit. S3 file is gone.
  expires_at        DateTime? @db.Timestamptz(6)
  deleted_at        DateTime? @db.Timestamptz(6)

  uploaded_at       DateTime  @default(now()) @db.Timestamptz(6)

  order             MarketplaceOrder @relation("OrderPrescriptions", fields: [order_id], references: [order_id], onDelete: Cascade)

  @@index([order_id])
  // Cron query: find expired but not yet deleted prescriptions
  @@index([expires_at, deleted_at])
  @@map("marketplace_order_prescriptions")
}

model MarketplaceOrderStatusHistory {

  history_id        String   @id @default(uuid()) @db.Uuid
  order_id          String   @db.Uuid

  // ── Transition ────────────────────────────────────────
  // from_status is null only for the initial PLACED entry.
  from_status       MarketplaceOrderStatus?
  to_status         MarketplaceOrderStatus

  // ── Actor ─────────────────────────────────────────────
  // changed_by_type: "customer" | "pharmacy" | "system"
  // changed_by_id: CureliMobileUser.id for customer,
  //                User.user_id for pharmacy,
  //                null for system (cron)
  changed_by_type   String   @db.VarChar(20)
  changed_by_id     String?  @db.Uuid

  // ── Optional context ──────────────────────────────────
  // For rejection: stores the rejection_reason value.
  // For cancellation: stores "customer" or "pharmacy".
  // For system: stores "auto_completed".
  reason            String?  @db.VarChar(300)

  created_at        DateTime @default(now()) @db.Timestamptz(6)


  order             MarketplaceOrder @relation("OrderStatusHistory", fields: [order_id], references: [order_id], onDelete: Cascade)


  // Ascending because status history is always read chronologically.
  @@index([order_id, created_at(sort: Asc)])
  @@map("marketplace_order_status_history")
}



// ════════════════════════════════════════════════════════════════════════════════════════════════════════════
// CURELI MOBILE — CUSTOMER AUTH FOUNDATION
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════

model CureliMobileUser {
  id                     String    @id @default(uuid()) @db.Uuid

  phone                  String    @unique @db.VarChar(15)
  phone_verified         Boolean   @default(false)
  phone_verified_at      DateTime? @db.Timestamptz(6)

  email                  String?   @unique @db.VarChar(255)
  full_name              String?   @db.VarChar(200)
  profile_image_key      String?   @db.VarChar(500)
  date_of_birth        DateTime? @db.Date
  sex                  UserSex?
  profile_complete     Boolean   @default(false)

  status                 String    @default("active") @db.VarChar(20)
  suspended_at           DateTime? @db.Timestamptz(6)
  suspension_reason      String?   @db.VarChar(500)
  suspended_by           String?   @db.VarChar(100)

  deleted_at             DateTime? @db.Timestamptz(6)
  deletion_reason        String?   @db.VarChar(500)

  delete_otp_hash        String?
  delete_otp_expires     DateTime? @db.Timestamptz(6)

  login_otp_hash         String?
  login_otp_expires      DateTime? @db.Timestamptz(6)
  login_otp_attempts     Int       @default(0)
  otp_cycle_failures     Int       @default(0)
  otp_locked_until       DateTime? @db.Timestamptz(6)

  phone_change_new       String?   @db.VarChar(15)
  phone_change_otp_hash  String?
  phone_change_expires   DateTime? @db.Timestamptz(6)

  logout_all_issued_at   DateTime? @db.Timestamptz(6)

  referral_code          String?   @unique @db.VarChar(20)
  referred_by_code       String?   @db.VarChar(20)

  created_at             DateTime  @default(now()) @db.Timestamptz(6)
  updated_at             DateTime  @updatedAt @db.Timestamptz(6)
  last_seen_at           DateTime? @db.Timestamptz(6)

  sessions               CureliMobileSession[]
  addresses              CureliMobileAddress[]
  marketplaceOrders      MarketplaceOrder[]         @relation("CustomerMarketplaceOrders")
  pushPreference         CureliMobilePushPreference?
  mobileNotifications    CureliMobileNotification[]

  // ── NEW RELATION ──────────────────────────────────────────
  checkoutSessions       CheckoutSession[]           @relation("CustomerCheckoutSessions")
  familyMembers        CureliMobileFamilyMember[]

  // ─────────────────────────────────────────────────────────

  @@index([phone])
  @@index([status])
  @@index([deleted_at])
  @@index([created_at(sort: Desc)])
  @@map("cureli_mobile_users")
}

model CureliMobileFamilyMember {
  id             String    @id @default(uuid()) @db.Uuid
  user_id        String    @db.Uuid
  name           String    @db.VarChar(200)
  date_of_birth  DateTime  @db.Date
  sex            UserSex
  phone          String?   @db.VarChar(15)
  deleted_at     DateTime? @db.Timestamptz(6)
  created_at     DateTime  @default(now()) @db.Timestamptz(6)
  updated_at     DateTime  @updatedAt @db.Timestamptz(6)

  user           CureliMobileUser @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id])
  @@index([user_id, deleted_at])
  @@map("cureli_mobile_family_members")
}

model CureliMobileSession {
  id                    String    @id @default(uuid()) @db.Uuid
  user_id               String    @db.Uuid
  refresh_token_hash    String    @unique @db.VarChar(500)
  device_id             String?   @db.VarChar(255)
  device_name           String?   @db.VarChar(200)
  device_platform       String?   @db.VarChar(20)
  device_os_version     String?   @db.VarChar(50)
  app_version           String?   @db.VarChar(20)
  push_token            String?   @db.VarChar(500)
  push_token_type       String?   @db.VarChar(20)
  push_token_updated_at DateTime? @db.Timestamptz(6)
  ip_address            String?   @db.VarChar(45)
  user_agent            String?   @db.VarChar(500)
  is_active             Boolean   @default(true)
  created_at            DateTime  @default(now()) @db.Timestamptz(6)
  last_active_at        DateTime  @default(now()) @db.Timestamptz(6)
  expires_at            DateTime  @db.Timestamptz(6)
  revoked_at            DateTime? @db.Timestamptz(6)
  revoked_reason        String?   @db.VarChar(50)

  // ── Relations ─────────────────────────────────────────────
  user                  CureliMobileUser @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id])
  @@index([refresh_token_hash])
  @@index([user_id, is_active])
  @@index([expires_at])
  @@index([device_id])
  @@map("cureli_mobile_sessions")
}

model CureliMobileAddress {
  id               String    @id @default(uuid()) @db.Uuid
  user_id          String    @db.Uuid
  label            String    @db.VarChar(50)
  custom_label     String?   @db.VarChar(100)
  recipient_name   String?   @db.VarChar(200)
  recipient_phone  String?   @db.VarChar(15)
  address_line_1   String    @db.VarChar(300)
  address_line_2   String?   @db.VarChar(300)
  landmark         String?   @db.VarChar(200)
  city             String    @db.VarChar(100)
  state            String    @db.VarChar(100)
  pincode          String    @db.VarChar(10)
  latitude         Decimal?  @db.Decimal(10, 8)
  longitude        Decimal?  @db.Decimal(11, 8)
  is_default       Boolean   @default(false)
  deleted_at       DateTime? @db.Timestamptz(6)
  created_at       DateTime  @default(now()) @db.Timestamptz(6)
  updated_at       DateTime  @updatedAt @db.Timestamptz(6)

  // ── Relations ─────────────────────────────────────────────
  user             CureliMobileUser @relation(fields: [user_id], references: [id], onDelete: Cascade)
  orders                  MarketplaceOrder[]         @relation("OrderDeliveryAddress")
  @@index([user_id])
  @@index([user_id, is_default])
  @@index([deleted_at])
  @@map("cureli_mobile_addresses")
}

model CureliMobileDeletedAccount {
  id                   String    @id @default(uuid()) @db.Uuid

  // ── Original identity ─────────────────────────────────────
  // original_user_id is preserved for linking future order/transaction data.
  // It is NOT a foreign key — the user row no longer exists.
  original_user_id     String    @db.Uuid

  // Phone is SHA-256 hashed — NOT plaintext.
  // Reason: the same phone can register again as a fresh account.
  // We need to know "a deleted account existed for this phone"
  // without creating a collision risk with a new live user.
  // SHA-256 (not bcrypt) because we need to hash-and-lookup,
  // not hash-and-verify. Deterministic hash is required here.
  phone_hash           String    @db.VarChar(64)

  // Profile snapshot at time of deletion — kept for order context.
  full_name            String?   @db.VarChar(200)
  email                String?   @db.VarChar(255)

  // Metadata
  deletion_reason      String    @default("user_requested") @db.VarChar(50)
  account_created_at   DateTime  @db.Timestamptz(6)
  address_count        Int       @default(0)
  deleted_at           DateTime  @default(now()) @db.Timestamptz(6)

  @@index([original_user_id])
  @@index([phone_hash])
  @@index([deleted_at])
  @@map("cureli_mobile_deleted_accounts")
}


// ════════════════════════════════════════════════════════════════════════════════════════════════════════════
// CURELI MOBILE — PUSH NOTIFICATIONS
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════

// Per-user notification preferences.
// One row per user — upserted on first login or when user changes preferences.
// category values must match PUSH_CATEGORIES constant in push service.
model CureliMobilePushPreference {
  id          String   @id @default(uuid()) @db.Uuid
  user_id     String   @unique @db.Uuid
  
  // Master toggle — if false, no push sent regardless of categories
  master_enabled Boolean @default(true)

  // Per-category toggles
  // All default true except promotions which some users may opt out of
  order_updates           Boolean @default(true)
  promotions              Boolean @default(true)
  prescription_updates    Boolean @default(true)
  system_messages         Boolean @default(true)
  cart_abandonment        Boolean @default(true)

  created_at  DateTime @default(now()) @db.Timestamptz(6)
  updated_at  DateTime @updatedAt @db.Timestamptz(6)

  user        CureliMobileUser @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id])
  @@map("cureli_mobile_push_preferences")
}

// Mobile notification inbox — persisted push notifications for the mobile app.
// Separate from the ERP Notification model which serves ERP users and cadmins.
// This table is the source of truth for the mobile notification center.
model CureliMobileNotification {
  id              String    @id @default(uuid()) @db.Uuid
  user_id         String    @db.Uuid

  // Notification content
  title           String    @db.VarChar(200)
  body            String    @db.VarChar(500)
  
  // Category — matches PUSH_CATEGORIES constant
  // Values: order_updates | promotions | prescription_updates | system_messages | cart_abandonment
  category        String    @db.VarChar(50)

  // Deep link data — determines where tapping the notification goes
  // Shape: { screen: 'order_detail', params: { orderId: '...' } }
  //        { screen: 'product', params: { productId: '...' } }
  //        { screen: 'home' }
  //        { screen: 'cart' }
  //        { screen: 'prescription_upload' }
  data            Json?

  // Read state
  is_read         Boolean   @default(false)
  read_at         DateTime? @db.Timestamptz(6)

  // Push delivery state
  // push_sent = false means it was created in inbox but push failed or user had no token
  push_sent       Boolean   @default(false)
  push_ticket_id  String?   @db.VarChar(200)  // Expo push ticket ID for receipt checking

  // Campaign link — set when sent via cadmin mobile broadcast
  campaign_id     String?   @db.Uuid

  created_at      DateTime  @default(now()) @db.Timestamptz(6)

  user            CureliMobileUser @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id, is_read, created_at(sort: Desc)])
  @@index([user_id, created_at(sort: Desc)])
  @@index([category])
  @@index([campaign_id])
  @@index([created_at(sort: Desc)])
  @@map("cureli_mobile_notifications")
}

// Mobile push broadcast campaigns — cadmin → mobile customers.
// Separate from BroadcastCampaign which targets ERP users.
model CureliMobileBroadcastCampaign {
  id                String    @id @default(uuid()) @db.Uuid

  // Content
  title             String    @db.VarChar(200)
  body              String    @db.VarChar(500)
  category          String    @default("promotions") @db.VarChar(50)

  // Deep link — where tapping the notification goes on mobile
  // screen values: home | cart | order_detail | product | category | prescription_upload
  tap_action        String    @default("home") @db.VarChar(50)
  tap_params        Json?     // e.g. { productId: '...' } or { categoryName: '...' }

  // Targeting
  // target_all = true → send to all active users with push tokens
  // target_all = false → use target_user_ids
  target_all        Boolean   @default(true)
  target_user_ids   String[]  @db.Uuid  // populated when target_all = false

  // Audience filters (stored for display/audit — actual resolution happens at send time)
  audience_filters  Json?

  // Status lifecycle: draft → scheduled → sending → sent | failed | cancelled
  status            String    @default("draft") @db.VarChar(20)
  scheduled_for     DateTime? @db.Timestamptz(6)
  sent_at           DateTime? @db.Timestamptz(6)

  // Results
  targeted_count    Int       @default(0)   // how many users were targeted
  sent_count        Int       @default(0)   // how many push tickets created
  delivered_count   Int       @default(0)   // confirmed delivered (from receipts)
  failed_count      Int       @default(0)

  // Audit
  created_by_cadmin String    @db.Uuid
  cadmin_name       String    @db.VarChar(100)
  created_at        DateTime  @default(now()) @db.Timestamptz(6)
  updated_at        DateTime  @updatedAt @db.Timestamptz(6)

  cadmin            CAdmin    @relation("MobileBroadcastCampaigns", fields: [created_by_cadmin], references: [cadmin_id])

  @@index([status, scheduled_for])
  @@index([created_by_cadmin])
  @@index([created_at(sort: Desc)])
  @@map("cureli_mobile_broadcast_campaigns")
}


// ════════════════════════════════════════════════════════════════════════════════════════════════════════════
// BROADCAST / COMMS / OTP
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════

model Notification {
  notification_id String    @id @default(uuid()) @db.Uuid
  user_id         String?   @db.Uuid
  event_type      String    @db.VarChar(100)
  title           String    @db.VarChar(200)
  message         String
  context         Json?
  shop_id         String?   @db.Uuid
  branch_id       String?   @db.Uuid
  dedup_key       String?   @db.VarChar(255)
  priority        String    @default("normal") @db.VarChar(20)
  is_read         Boolean   @default(false)
  read_at         DateTime? @db.Timestamptz(6)
  created_at      DateTime  @default(now()) @db.Timestamptz(6)
  cadmin_id       String?   @db.Uuid
  cadmin          CAdmin?   @relation("CAdminNotifications", fields: [cadmin_id], references: [cadmin_id], onDelete: Cascade)
  user            User?     @relation("UserNotifications", fields: [user_id], references: [user_id], onDelete: Cascade)

  @@index([user_id, is_read, created_at(sort: Desc)])
  @@index([user_id, created_at(sort: Desc)])
  @@index([cadmin_id, is_read, created_at(sort: Desc)])
  @@index([cadmin_id, created_at(sort: Desc)])
  @@index([shop_id, event_type])
  @@index([dedup_key])
  @@index([created_at(sort: Desc)])
  @@map("notifications")
}

model BroadcastCampaign {
  campaign_id       String    @id @default(uuid()) @db.Uuid
  title             String    @db.VarChar(200)
  message           String
  priority          String    @default("normal") @db.VarChar(20)
  target_filters    Json
  recipient_count   Int?
  status            String    @default("draft") @db.VarChar(20)
  scheduled_for     DateTime? @db.Timestamptz(6)
  sent_at           DateTime? @db.Timestamptz(6)
  delivered_count   Int?
  read_count        Int?
  attachmentFiles   BroadcastAttachment[] @relation("CampaignAttachments")
  created_by_cadmin String    @db.Uuid
  cadmin_name       String    @db.VarChar(100)
  created_at        DateTime  @default(now()) @db.Timestamptz(6)
  updated_at        DateTime  @updatedAt @db.Timestamptz(6)
  action_label      String?   @db.VarChar(100)
  action_url        String?   @db.VarChar(500)
  attachments       Json?
  expires_at        DateTime? @db.Timestamptz(6)
  target_cadmins    Boolean   @default(false)
  target_users      Boolean   @default(true)
  cadmin            CAdmin    @relation("BroadcastCampaigns", fields: [created_by_cadmin], references: [cadmin_id])

  @@index([status, scheduled_for])
  @@index([created_by_cadmin])
  @@index([created_at(sort: Desc)])
  @@map("broadcast_campaigns")
}

model EmailBroadcastAttachment {
  attachment_id String   @id @default(uuid()) @db.Uuid
  campaign_id   String   @db.Uuid
  
  // File info
  file_type     EmailAttachmentType  // "INLINE" or "ATTACHMENT"
  storage_key   String               // Just filename (e.g., "email-123.jpg")
  original_name String   @db.VarChar(255)
  mime_type     String   @db.VarChar(100)
  file_size     Int
  
  // Optional metadata
  content_id    String?  @db.VarChar(100)  // For inline images (cid:xxx)
  
  uploaded_at   DateTime @default(now()) @db.Timestamptz(6)
  
  // Relations
  campaign      EmailBroadcastCampaign @relation("CampaignAttachments", fields: [campaign_id], references: [campaign_id], onDelete: Cascade)
  
  @@index([campaign_id])
  @@index([file_type])
  @@map("email_broadcast_attachments")
}

model BroadcastAttachment {
  attachment_id String   @id @default(uuid()) @db.Uuid
  campaign_id   String   @db.Uuid
  
  // File info
  attachment_type BroadcastAttachmentType  // "IMAGE", "VIDEO", "LINK"
  storage_key     String?              // Filename (null for links)
  original_name   String?  @db.VarChar(255)
  mime_type       String?  @db.VarChar(100)
  file_size       Int?
  
  // Link metadata (for type=LINK)
  link_url        String?  @db.VarChar(500)
  link_label      String?  @db.VarChar(100)
  
  uploaded_at     DateTime @default(now()) @db.Timestamptz(6)
  
  // Relations
  campaign        BroadcastCampaign @relation("CampaignAttachments", fields: [campaign_id], references: [campaign_id], onDelete: Cascade)
  
  @@index([campaign_id])
  @@index([attachment_type])
  @@map("broadcast_attachments")
}

model BroadcastSegment {
  segment_id        String   @id @default(uuid()) @db.Uuid
  name              String   @db.VarChar(100)
  description       String?
  filters           Json
  created_by_cadmin String   @db.Uuid
  created_at        DateTime @default(now()) @db.Timestamptz(6)
  updated_at        DateTime @updatedAt @db.Timestamptz(6)
  cadmin            CAdmin   @relation("BroadcastSegments", fields: [created_by_cadmin], references: [cadmin_id])

  @@index([created_by_cadmin])
  @@map("broadcast_segments")
}

model BroadcastTemplate {
  template_id       String   @id @default(uuid()) @db.Uuid
  name              String   @db.VarChar(100)
  title             String   @db.VarChar(200)
  message           String
  priority          String   @default("normal") @db.VarChar(20)
  attachments       Json?
  usage_count       Int      @default(0)
  created_by_cadmin String   @db.Uuid
  created_at        DateTime @default(now()) @db.Timestamptz(6)
  updated_at        DateTime @updatedAt @db.Timestamptz(6)
  cadmin            CAdmin   @relation("BroadcastTemplates", fields: [created_by_cadmin], references: [cadmin_id])

  @@index([created_by_cadmin])
  @@index([usage_count(sort: Desc)])
  @@map("broadcast_templates")
}

model EmailBroadcastCampaign {
  campaign_id         String    @id @default(uuid()) @db.Uuid
  subject             String    @db.VarChar(300)
  body_html           String
  body_text           String?
  from_name           String    @db.VarChar(100)
  from_email          String    @db.VarChar(100)
  reply_to            String?   @db.VarChar(100)
  
  // Targeting
  target_filters      Json
  target_users        Boolean   @default(true)    //  ADD THIS
  target_cadmins      Boolean   @default(false)   //  ADD THIS
  recipient_count     Int       @default(0)
  
  // Content
  inline_image        Json?
  attachments         Json?
  action_url          String?   @db.VarChar(500)  //  ADD THIS
  action_label        String?   @db.VarChar(100)  //  ADD THIS

  attachmentFiles     EmailBroadcastAttachment[] @relation("CampaignAttachments")
  
  // Scheduling & Status
  status              EmailCampaignStatus @default(DRAFT)
  scheduled_for       DateTime?           @db.Timestamptz(6)
  
  // Processing
  processing          Boolean   @default(false)
  processing_started_at DateTime? @db.Timestamptz(6)
  last_processed_index Int      @default(0)
  
  // Results
  delivered_count     Int       @default(0)
  failed_count        Int       @default(0)
  bounced_count       Int       @default(0)
  opened_count        Int       @default(0)
  clicked_count       Int       @default(0)
  unsubscribed_count  Int       @default(0)
  
  // Metadata
  sent_at             DateTime? @db.Timestamptz(6)
  completed_at        DateTime? @db.Timestamptz(6)
  last_error          String?
  
  // Audit
  created_by_cadmin   String    @db.Uuid
  cadmin_name         String    @db.VarChar(100)
  created_at          DateTime  @default(now()) @db.Timestamptz(6)
  updated_at          DateTime  @updatedAt @db.Timestamptz(6)
  
  // Relations
  cadmin              CAdmin    @relation("EmailBroadcastCampaigns", fields: [created_by_cadmin], references: [cadmin_id])
  recipients          EmailBroadcastRecipient[] @relation("CampaignRecipients")
  
  @@index([status, scheduled_for])
  @@index([created_by_cadmin])
  @@index([created_at(sort: Desc)])
  @@index([processing, status])
  @@map("email_broadcast_campaigns")
}

model EmailBroadcastRecipient {
  recipient_id  String   @id @default(uuid()) @db.Uuid
  campaign_id   String   @db.Uuid
  
  // Recipient info
  email         String   @db.VarChar(255)
  name          String?  @db.VarChar(200)
  user_id       String?  @db.Uuid
  shop_id       String?  @db.Uuid
  
  // Delivery status
  status        EmailRecipientStatus @default(PENDING)
  sent_at       DateTime?            @db.Timestamptz(6)
  delivered_at  DateTime?            @db.Timestamptz(6)
  opened_at     DateTime?            @db.Timestamptz(6)
  clicked_at    DateTime?            @db.Timestamptz(6)
  bounced_at    DateTime?            @db.Timestamptz(6)
  failed_at     DateTime?            @db.Timestamptz(6)
  
  // Provider details
  provider_message_id String? @db.VarChar(255)
  error_message       String?
  bounce_reason       String?
  
  created_at    DateTime @default(now()) @db.Timestamptz(6)
  
  campaign      EmailBroadcastCampaign @relation("CampaignRecipients", fields: [campaign_id], references: [campaign_id], onDelete: Cascade)
  
  @@index([campaign_id, status])
  @@index([email])
  @@index([status])
  @@map("email_broadcast_recipients")
}

model DailySendQuota {
  date       String   @id @db.VarChar(10) // YYYY-MM-DD format
  sent_count Int      @default(0)
  created_at DateTime @default(now()) @db.Timestamptz(6)
  updated_at DateTime @updatedAt @db.Timestamptz(6)
  
  @@index([date])
  @@map("daily_send_quota")
}

model EmailUnsubscribe {
  unsubscribe_id  String   @id @default(uuid()) @db.Uuid
  email           String   @unique @db.VarChar(255)
  token           String?  @db.VarChar(255)  // ← ADD THIS
  user_id         String?  @db.Uuid
  cadmin_id       String?  @db.Uuid          // ← RENAME from shop_id
  reason          String?  @db.VarChar(500)  // ← increase length for longer reasons
  unsubscribed_at DateTime @default(now()) @db.Timestamptz(6)

  @@index([email])
  @@map("email_unsubscribes")
}

model CronLock {
  job_name    String    @id @db.VarChar(100)
  locked_by   String?   @db.VarChar(255)
  locked_at   DateTime? @db.Timestamptz(6)
  expires_at  DateTime? @db.Timestamptz(6)
  last_result String?   @db.VarChar(20)
  last_run_at DateTime? @db.Timestamptz(6)

  @@index([expires_at])
  @@map("cron_locks")
}

model OtpDailyLimit {
  id         String   @id @default(uuid())
  identifier String   // "sms:9961045596" or "email:user@example.com"
  date       DateTime @db.Date
  count      Int      @default(0)
  created_at DateTime @default(now())

  @@unique([identifier, date], name: "identifier_date")
  @@index([date])
  @@map("otp_daily_limits")
}

model Ticket {
  ticket_id          String           @id @default(uuid()) @db.Uuid
  ticket_number      String           @unique @db.VarChar(30)

  // Ownership
  shop_id            String           @db.Uuid
  branch_id          String?          @db.Uuid
  created_by_user_id String           @db.Uuid

  // Cancellation actor (nullable — only set when cancelled)
  cancelled_by_user_id String?        @db.Uuid

  // Reopen actor (nullable — only set when last reopened)
  reopened_by_user_id  String?        @db.Uuid

  // Content
  contact_number     String           @db.VarChar(15)
  category           TicketCategory
  other_category_text String?         @db.VarChar(100)
  subject            String           @db.VarChar(200)
  description        String?
  preferred_slot     String           @db.VarChar(20)

  // State (managed ONLY by state machine)
  status             TicketStatus     @default(PENDING)
  reopen_count       Int              @default(0)

  // Counters (denormalised for query speed)
  attachment_count   Int              @default(0)
  activity_count     Int              @default(0)

  // Timestamps
  created_at         DateTime         @default(now()) @db.Timestamptz(6)
  updated_at         DateTime         @updatedAt @db.Timestamptz(6)
  resolved_at        DateTime?        @db.Timestamptz(6)
  closed_at          DateTime?        @db.Timestamptz(6)
  cancelled_at       DateTime?        @db.Timestamptz(6)

  // Relations
  shop               Shop             @relation("ShopTickets", fields: [shop_id], references: [shop_id])
  branch             Branch?          @relation("BranchTickets", fields: [branch_id], references: [branch_id])
  created_by         User             @relation("TicketCreator", fields: [created_by_user_id], references: [user_id])
  cancelled_by       User?            @relation("TicketCanceller", fields: [cancelled_by_user_id], references: [user_id])
  reopened_by        User?            @relation("TicketReopener", fields: [reopened_by_user_id], references: [user_id])
  attachments        TicketAttachment[]
  activities         TicketActivity[]

  @@index([shop_id, status, created_at(sort: Desc)])
  @@index([branch_id, status])
  @@index([created_by_user_id])
  @@index([status, created_at(sort: Desc)])
  @@index([ticket_number])
  @@index([cancelled_by_user_id])
  @@index([reopened_by_user_id])
  @@map("tickets")
}

model TicketActivity {
  activity_id    String              @id @default(uuid()) @db.Uuid
  ticket_id      String              @db.Uuid

  // What happened
  type           TicketActivityType
  from_status    TicketStatus?       // null for COMMENT / CREATED
  to_status      TicketStatus?       // null for COMMENT

  // Who did it
  actor_type     String              @db.VarChar(20)  // "ERP_USER" | "CADMIN" | "SYSTEM"
  actor_id       String              @db.Uuid
  actor_name     String              @db.VarChar(150)
  actor_role     String?             @db.VarChar(50)

  // The message/reason for this action (optional for pure status changes)
  note           String?

  // Visibility
  is_internal    Boolean             @default(false)  // true = cadmin-only note

  created_at     DateTime            @default(now()) @db.Timestamptz(6)

  ticket         Ticket              @relation(fields: [ticket_id], references: [ticket_id], onDelete: Cascade)

  @@index([ticket_id, created_at(sort: Asc)])
  @@index([type])
  @@index([actor_id])
  @@map("ticket_activities")
}

model TicketAttachment {
  attachment_id  String   @id @default(uuid()) @db.Uuid
  ticket_id      String   @db.Uuid
  storage_key    String
  original_name  String   @db.VarChar(255)
  mime_type      String   @db.VarChar(100)
  file_size      Int
  uploaded_at    DateTime @default(now()) @db.Timestamptz(6)

  ticket         Ticket   @relation(fields: [ticket_id], references: [ticket_id], onDelete: Cascade)

  @@index([ticket_id])
  @@map("ticket_attachments")
}

model Enquiry {
  enquiry_id     String         @id @default(uuid()) @db.Uuid
  enquiry_number String         @unique @db.VarChar(30)
  name           String         @db.VarChar(100)
  email          String         @db.VarChar(255)
  phone          String?        @db.VarChar(20)
  message        String
  status         EnquiryStatus  @default(PENDING)
  created_at     DateTime       @default(now()) @db.Timestamptz(6)
  updated_at     DateTime       @updatedAt @db.Timestamptz(6)
  replies        EnquiryReply[]

  @@index([status])
  @@index([created_at])
  @@index([email])
  @@map("enquiries")
}

model EnquiryReply {
  reply_id      String    @id @default(uuid()) @db.Uuid
  enquiry_id    String    @db.Uuid
  replied_by_id String    @db.Uuid
  subject       String    @db.VarChar(200)
  message       String
  email_sent    Boolean   @default(false)
  email_sent_at DateTime? @db.Timestamptz(6)
  email_error   String?
  created_at    DateTime  @default(now()) @db.Timestamptz(6)
  enquiry       Enquiry   @relation(fields: [enquiry_id], references: [enquiry_id], onDelete: Cascade)
  replied_by    CAdmin    @relation("EnquiryRepliedBy", fields: [replied_by_id], references: [cadmin_id])

  @@index([enquiry_id])
  @@index([replied_by_id])
  @@map("enquiry_replies")
}




// ════════════════════════════════════════════════════════════════════════════════════════════════════════════
// OTHER MODELS
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════


model AuditLog {
  audit_id       String   @id @default(uuid()) @db.Uuid
  action         String   @db.VarChar(100)
  actor_type     String   @db.VarChar(20)
  actor_id       String?  @db.Uuid
  actor_role     String?  @db.VarChar(50)
  entity_type    String   @db.VarChar(30)
  entity_id      String?  @db.Uuid
  shop_id        String?  @db.Uuid
  branch_id      String?  @db.Uuid
  correlation_id String?  @db.Uuid
  reason_code    String?  @db.VarChar(50)
  metadata       Json?
  ip_address     String?
  user_agent     String?
  created_at     DateTime @default(now()) @db.Timestamptz(6)

  @@index([shop_id, created_at(sort: Desc)])
  @@index([entity_type, entity_id, created_at(sort: Desc)])
  @@index([actor_id, created_at(sort: Desc)])
  @@index([action, created_at(sort: Desc)])
  @@index([correlation_id])
  @@index([created_at(sort: Desc)])
  @@map("audit_logs")
}

model ActivityLog {
  activity_id String   @id @default(uuid()) @db.Uuid
  user_id     String   @db.Uuid
  action      String
  description String?
  ip_address  String?
  user_agent  String?
  created_at  DateTime @default(now()) @db.Timestamptz(6)
  user        User     @relation(fields: [user_id], references: [user_id])

  @@index([user_id])
  @@map("activity_logs")
}

model DeletionLog {
  id              String   @id @default(uuid()) @db.Uuid
  user_id         String   @db.Uuid
  email           String?
  username        String?
  reason          String
  onboarding_step Int?
  days_inactive   Int?
  files_deleted   Int      @default(0)
  deleted_at      DateTime @default(now()) @db.Timestamptz(6)

  @@map("deletion_logs")
}

model FileVerificationLog {
  id         String   @id @default(uuid()) @db.Uuid
  file_id    String   @db.Uuid
  shop_id    String   @db.Uuid
  cadmin_id  String?  @db.Uuid
  actor_type String
  action     String
  reason     String?
  meta       Json?
  created_at DateTime @default(now()) @db.Timestamptz(6)

  @@index([file_id])
  @@map("file_verification_logs")
}

model PlanActivityLog {
  id          String   @id @default(uuid()) @db.Uuid
  plan_id     String   @db.Uuid
  cadmin_id   String?  @db.Uuid
  action      String   @db.VarChar(50)
  from_status String?  @db.VarChar(20)
  to_status   String?  @db.VarChar(20)
  changes     Json?
  meta        Json?
  created_at  DateTime @default(now()) @db.Timestamptz(6)
  cadmin      CAdmin?  @relation("PlanActivityByCAdmin", fields: [cadmin_id], references: [cadmin_id])
  plan        Plan     @relation(fields: [plan_id], references: [plan_id])

  @@index([plan_id])
  @@index([cadmin_id])
  @@index([action])
  @@index([created_at])
  @@map("plan_activity_logs")
}




// ════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ENUMS
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════
enum LinkStatus {
  PENDING       // Not yet matched
  AUTO_LINKED   // Auto-matched with high confidence
  SUGGESTED     // Needs manual confirmation
  MANUAL_LINKED // Manually confirmed by user
  UNLINKED      // Intentionally kept separate
}
enum MarketplaceStatus {
  NOT_STARTED
  DRAFT
  LIVE
  SUSPENDED
}

enum EmailAttachmentType {
  INLINE
  ATTACHMENT
}

enum MedicineType {
  DRUG
  OTC
}

enum ImageType {
  PRIMARY
  GALLERY
}

enum ImageSource {
  SCRAPED
  UPLOADED
}


enum PlanStatus {
  DRAFT
  ACTIVE
  DEPRECATED
  SUSPENDED
}

enum PlanType {
  PRE_MADE
  CUSTOM
}

enum EnquiryStatus {
  PENDING
  IN_PROGRESS
  REPLIED
  CLOSED
}

enum StockMovementType {
  PURCHASE
  PURCHASE_RETURN
  SALE
  SALE_RETURN
  OPENING_STOCK
  STOCK_ADJUSTMENT
  DAMAGED
  EXPIRED
  TRANSFER_IN
  TRANSFER_OUT
  INVENTORY_IMPORT    
}
enum ImportJobStatus {
  PENDING
  PARSING
  AWAITING_REVIEW
  CONFIRMING
  COMPLETED
  PARTIAL
  FAILED
  CANCELLED
}

enum InventorySource {
  MANUAL
  PURCHASE
  IMPORT
}
enum AdjustmentReason {
  PHYSICAL_COUNT_VARIANCE
  DAMAGED_GOODS
  EXPIRED_GOODS
  SYSTEM_CORRECTION
  THEFT_LOSS
  OTHER
}

enum ReturnReason {
  DAMAGED_GOODS
  EXPIRED_GOODS
  WRONG_ITEM_RECEIVED
  QUALITY_ISSUE
  EXCESS_STOCK
  PRICE_DIFFERENCE
  OTHER
}


enum BroadcastAttachmentType {
  IMAGE
  VIDEO
  LINK
}

enum PaymentAdjustmentType {
  CASH_REFUND
  CREDIT_NOTE
  OFFSET_NEXT_PURCHASE
}

enum ReturnApprovalStatus {
  PENDING_APPROVAL
  APPROVED
  REJECTED
  CANCELLED
}

enum SalesReturnReason {
  EXPIRED_PRODUCT
  DAMAGED_PRODUCT
  WRONG_PRODUCT
  CUSTOMER_REQUEST
  QUALITY_ISSUE
  PRICE_DISPUTE
  OTHER
}

enum SalesReturnApprovalStatus {
  PENDING_APPROVAL
  APPROVED
  REJECTED
  CANCELLED
}

enum SalesRefundMode {
  CASH
  CREDIT
  ADJUST_NEXT
}

// Enums
enum EmailCampaignStatus {
  DRAFT
  SCHEDULED
  SENDING
  PAUSED
  SENT
  PARTIAL_FAILURE
  FAILED
  CANCELLED
}

enum EmailRecipientStatus {
  PENDING
  SENT
  DELIVERED
  OPENED
  CLICKED
  BOUNCED
  FAILED
  UNSUBSCRIBED
}

// ── ENUMS ─────────────────────────────────────────────────────────────────────
enum TicketStatus {
  PENDING
  IN_PROGRESS
  RESOLVED
  CLOSED
  CANCELLED
}

enum TicketCategory {
  TECHNICAL_ISSUE
  BILLING_ISSUE
  FEATURE_REQUEST
  ACCOUNT_ISSUE
  OTHER
}

enum TicketActivityType {
  CREATED          // ticket first created
  STATUS_CHANGED   // any status transition
  COMMENT          // note without status change (admin internal or user-visible)
  REOPENED         // convenience alias (also sets status back to PENDING)
  CANCELLED        // user or admin cancelled
  ATTACHMENT_ADDED // file uploaded post-creation
}

enum MarketplaceStockStatus {
  IN_STOCK
  OUT_OF_STOCK
}

enum MarketplaceOrderStatus {
  PLACED
  ACCEPTED
  READY_FOR_PICKUP
  COMPLETED
  REJECTED
  CANCELLED
}

enum UserSex {
  MALE
  FEMALE
  OTHER
}