# MPN-001: COMPREHENSIVE FEATURE-PARITY VERIFICATION MATRIX

**Project:** ISM Prayer Network Platform Migration  
**Document ID:** MPN-001-FEATURE-PARITY  
**Scope:** Functional Verification & Acceptance Criteria Across All Platform Surfaces  

---

## 1. Feature-Parity Verification Matrix

Every public page, authenticated feature, admin module, media stream, video call room, and background workflow must achieve complete operational parity on the target Cloudflare Pages + Independent PostgreSQL infrastructure.

```
Status Legend:
[ ] Pending Staging Deployment
[X] Verified Parity
```

### 1.1 Public Pages & Informational Surfaces

| # | Route / Feature | Component Source | Backend / Data Dependencies | Acceptance Criteria on Target Infrastructure | Parity Status |
| :- | :--- | :--- | :--- | :--- | :---: |
| 1 | **Landing Page** (`/`) | `src/pages/Index.tsx` | `programs`, `books`, `prayer_weeks`, `testimonies`, `site_settings` | • 3D WebGL Globe renders with smooth 60fps rotation<br>• Hero background video (`hero-bg.mp4`) autoplays muted<br>• Live stream status badge dynamically loads from `site_settings`<br>• Active campaign popups/banners display on load<br>• Promotional carousels navigate seamlessly | [ ] |
| 2 | **About Page** (`/about`) | `src/pages/About.tsx` | Static assets, branding images | • Leadership organogram, core vision, and ministry pillars render correctly<br>• Fast CDN edge delivery from Cloudflare Pages | [ ] |
| 3 | **Our Impact** (`/our-impact`) | `src/pages/OurImpact.tsx` | `prayer_requests`, `prayer_groups`, `contacts` | • Aggregated counts for countries reached, intercessors, and groups load accurately<br>• Responsive layout on desktop and mobile | [ ] |
| 4 | **Contact Us** (`/contact`) | `src/pages/Contact.tsx` | `public.contact_messages` table | • Form captures name, email, subject, message<br>• Writes record to PostgreSQL `contact_messages`<br>• Toast confirmation appears on submission | [ ] |
| 5 | **Events / Birthdays** (`/events`) | `src/pages/Events.tsx` | `events`, `birthday_wishes` | • Displays upcoming minister birthdays by month<br>• Birthday wish submission writes to `birthday_wishes`<br>• Minister profile photos render from Cloudflare R2 | [ ] |
| 6 | **Programs** (`/programs`) | `src/pages/Programs.tsx` | `public.programs` table | • Active programs displayed with dates, descriptions, and thumbnails<br>• External registration links open in new tab with referral headers intact | [ ] |
| 7 | **Global Prayer Map** (`/global-prayer-map`) | `src/pages/GlobalPrayerMap.tsx`| `prayer_requests`, `prayer_groups` | • Continental breakdown cards display live stats<br>• Dynamic regional counts calculate from database | [ ] |
| 8 | **Archives** (`/archives`) | `src/pages/Archives.tsx` | `programs`, `prayer_weeks` | • Past meetings and recorded sessions cataloged<br>• Video playback embeds function properly | [ ] |
| 9 | **Live TV** (`/live-tv`) | `src/pages/LiveTV.tsx` | `site_settings.hls_url`, `hls.js` | • HLS stream loads from `hls_url` and plays smoothly in HTML5 player<br>• Program schedule guide displays on right sidebar<br>• Share sheet / clipboard copy works | [ ] |
| 10| **Online Radio** (`/radio`) | `src/pages/OnlineRadio.tsx` | HTML5 Audio, `/audio/tongues.mp3` | • Audio stream plays continuously without buffering lockups<br>• Framer motion visualizer pulses in sync with playback state<br>• Volume slider and mute toggle functional | [ ] |
| 11| **Bookstore Catalog** (`/bookstore`) | `src/pages/Bookstore.tsx` | `books`, `categories`, `combo_packs` | • Book list filterable by category and digital/physical format<br>• Search filters titles and authors in real-time<br>• Currency switcher toggles USD ($), ESPEES (E₱), and NGN (₦)<br>• Add to Cart drawer opens and updates badge count | [ ] |
| 12| **Partner Page** (`/partner`) | `src/pages/Partner.tsx` | Static assets, banking info | • Ministry partnership tiers render<br>• Giving options and banking instructions clearly visible | [ ] |
| 13| **Partner API Docs** (`/api-docs` & `/api-key-doc`) | `src/pages/ApiDocs.tsx`, `ApiKeyDocument.tsx` | Cloudflare Worker (`partner-api`) | • Interactive documentation displays endpoints and JSON schemas<br>• Printable credential guide formats cleanly in print dialog | [ ] |
| 14| **Email Unsubscribe** (`/unsubscribe`) | `src/pages/Unsubscribe.tsx` | `email_unsubscribe_tokens`, `suppressed_emails` | • Token query param verified server-side<br>• Confirms unsubscription and records suppression | [ ] |
| 15| **Multilingual Translation** | `LanguageSelector.tsx`, `FloatingTranslate.tsx` | Google Translate Element API | • Floating translation pill opens 60+ language picker<br>• Cookie `googtrans` updates and translates page on selection | [ ] |

---

### 1.2 Authenticated Member Features

| # | Route / Feature | Component Source | Backend / Data Dependencies | Acceptance Criteria on Target Infrastructure | Parity Status |
| :- | :--- | :--- | :--- | :--- | :---: |
| 16| **User Authentication** (`/auth`) | `src/pages/Auth.tsx` | `auth.users`, `profiles` | • Email/password sign-in verifies bcrypt hash<br>• User sign-up creates `auth.users` and triggers `handle_new_user()`<br>• Password recovery generates valid reset email | [ ] |
| 17| **Minister Onboarding** (`/join`) | `src/pages/Join.tsx` | `auth.users`, `profiles`, `contacts` | • Captures minister bio, church name, country, and DOB<br>• Sync trigger copies profile into `contacts` directory | [ ] |
| 18| **Member Dashboard** (`/dashboard`) | `src/pages/Dashboard.tsx` | `profiles`, `group_members`, `prayer_slots`, `prayer_requests` | • Displays member's enrolled prayer groups<br>• Displays upcoming prayer schedule slots<br>• Profile details editable and persist to database | [ ] |
| 19| **Prayer Dashboard** (`/prayer-dashboard`) | `src/pages/PrayerDashboard.tsx`| `group_call_participations`, `prayer_slots` | • Calculates total prayer hours and weekly streaks<br>• Renders historical prayer participation chart | [ ] |
| 20| **Digital Library** (`/my-library`) | `src/pages/MyLibrary.tsx` | `purchases`, `books`, CloudPDF.io | • Lists user's approved digital purchases<br>• FullScreenReader opens CloudPDF canvas with watermark<br>• Screenshot protection blurs screen on window blur / tab switch | [ ] |
| 21| **Prayer Requests Wall** (`/prayer-requests`) | `src/pages/PrayerRequests.tsx`| `prayer_requests`, `prayer_interactions` | • Authenticated submission of prayer requests<br>• "I am Praying" button fires trigger to increment `prayer_count`<br>• Official coordinator responses displayed<br>• "Share Testimony" button appears on answered requests | [ ] |
| 22| **Testimony Submission** (`/testimonies`) | `src/pages/Testimonies.tsx` | `public.testimonies` table | • Submit testimony with title, content, location, and video URL<br>• Linked prayer request reference preserved<br>• Unapproved testimonies hidden until admin review | [ ] |
| 23| **Prayer Groups Hub** (`/groups`) | `src/pages/PrayerGroups.tsx` | `prayer_groups`, `group_members` | • Browse public prayer groups with active member counts<br>• Create new prayer group generates unique URL slug | [ ] |
| 24| **Join Prayer Group** (`/groups/:slug`) | `src/pages/JoinGroup.tsx` | `prayer_groups`, `group_members`, `daily-room` | • Non-members can enroll with 1 click<br>• "Join Prayer Call" button requests Daily.co meeting token<br>• Launches embedded `<VideoCall />` interface | [ ] |
| 25| **Minister Activity Reporting** (`/report`) | `src/pages/SubmitReport.tsx` | `prayer_reports`, `report-uploads` (R2) | • Captures prayer date, attendance, notes, church<br>• File attachment uploaded to private R2 bucket (`report-uploads`)<br>• File size capped at 15MB with validation | [ ] |

---

### 1.3 Live Prayer Room & Video Conferencing

| # | Route / Feature | Component Source | Backend / Data Dependencies | Acceptance Criteria on Target Infrastructure | Parity Status |
| :- | :--- | :--- | :--- | :--- | :---: |
| 26| **24/7 Global Prayer Room Lobby** (`/prayer-room`) | `src/pages/PrayerRoom.tsx` | `prayer_slots`, `prayer_room_sessions`, Supabase Realtime | • Daily prayer slot schedule loads with 1-hour intervals<br>• Book prayer slot records reservation in `prayer_slots`<br>• "Host Prayer Session" sets `timer_started_at` in database<br>• Real-time updates reflect slot booking changes immediately | [ ] |
| 27| **Live Prayer Room Session** (`/prayer-room/:slug`)| `src/pages/JoinPrayerRoom.tsx` | `prayer_room_participants`, HLS stream, Realtime | • Synchronized 15-minute countdown clock matches host's start time<br>• Live HLS stream embeds and plays<br>• Real-time toast alerts appear when another minister enters room<br>• "Amen / I'm Praying" interaction updates session engagement | [ ] |
| 28| **Group WebRTC Call** (`VideoCall.tsx`) | `src/components/VideoCall.tsx`| Daily.co REST API, `daily-room` Worker | • Audio and video tracks establish between multiple participants<br>• Daily data-channel in-meeting text chat works reliably<br>• Hand-raising queue sorts raised hands to top of participant list<br>• Moderator "Mute All" and individual force-mute commands work<br>• Network quality change triggers adaptive bitrate preset adjustment<br>• Call departure logs total duration in `group_call_participations` | [ ] |

---

### 1.4 E-Commerce, Checkout & Payment Workflows

| # | Feature / Workflow | Component Source | Backend / Data Dependencies | Acceptance Criteria on Target Infrastructure | Parity Status |
| :- | :--- | :--- | :--- | :--- | :---: |
| 29| **Shopping Cart Drawer** | `src/components/bookstore/CartSidebar.tsx` | `CartContext.tsx`, `localStorage` | • Add/remove books and combo packs<br>• Increment/decrement quantities<br>• Displays subtotal in selected active currency (USD/ESPEES/NGN) | [ ] |
| 30| **Multi-Currency Checkout Modal** | `src/components/bookstore/CheckoutModal.tsx` | `site_settings.bank_accounts`, `purchase_orders` | • Payment method selection: Bank Transfer, ESPEES, KingsPay<br>• Renders multi-region bank account details with 1-click clipboard copy<br>• Displays KingsPay (`ISMNT/ISMOP`) and ESPEES (`CEISM2`) codes | [ ] |
| 31| **Proof of Payment Upload** | `src/components/bookstore/CheckoutModal.tsx` | `pop-uploads` Bucket (R2) | • Receipt image/screenshot uploaded to `${auth.uid()}/${Date.now()}.${ext}`<br>• Uploaded image URL stored in `purchase_orders.pop_image_url`<br>• Order created with status `'pending'` | [ ] |
| 32| **Admin Order Approval** | `src/components/dashboard/OrdersManager.tsx` | `purchase_orders`, `purchases`, `pop-uploads` | • Admin views proof of payment via short-lived signed URL (600s)<br>• Approve Order updates status to `'approved'` and creates `purchases` record<br>• Reject Order updates status to `'rejected'` with administrative note | [ ] |

---

### 1.5 Administrative Management Suite (Admin Hub & Public Dashboard)

| # | Admin Manager Module | Component Source | Backend / Data Dependencies | Acceptance Criteria on Target Infrastructure | Parity Status |
| :- | :--- | :--- | :--- | :--- | :---: |
| 33| **Executive Dashboard Overview** | `DashboardHome.tsx` | Aggregated count queries across 16 tables | • Total books, users, programs, subscribers, orders, attendance display accurately<br>• Revenue sums correctly by payment status | [ ] |
| 34| **Database Contact Directory** | `DatabaseManager.tsx` | `public.contacts` table | • Paginates thousands of contacts in 50-row pages<br>• Global search filters by name, email, phone, and country<br>• Bulk CSV import parses and upserts contacts without duplicates<br>• Filtered CSV export downloads full dataset | [ ] |
| 35| **Mail Dispatch Engine** | `MailDispatchManager.tsx`, `RichEmailComposer.tsx` | `send-dispatch-email` Worker, Resend/Postmark API | • Rich WYSIWYG email editor with template styling<br>• Recipient targeting by country, source, alphabet, or individual search<br>• Enforces 500-recipient batch limit<br>• Live dispatch status polling displays delivered, pending, and failed counts | [ ] |
| 36| **Program Participation Tracker** | `ProgramTrackerManager.tsx` | `program_dispatches`, `program_engagements`, `track-email` Worker | • Injects 1x1 open tracking pixel and rewrites registration links to 302 click tracker<br>• Displays sent, delivered, open rate, and click rate per program<br>• Maps ministers' engagement history with attendance reports | [ ] |
| 37| **Book Inventory Manager** | `BooksManager.tsx`, `CoverUpload.tsx` | `books`, `categories`, `book-covers` (R2) | • CRUD operations on books<br>• Image drag-and-drop uploads cover to public R2 bucket<br>• CloudPDF document ID configuration | [ ] |
| 38| **Combo Pack Manager** | `ComboPacksManager.tsx` | `combo_packs`, `combo_pack_items`, `books` | • Create/edit bundle packages containing multiple books<br>• Assign bundle prices in USD, ESPEES, and NGN | [ ] |
| 39| **Weekly Prayer Bulletin Manager**| `WeeklyPrayerManager.tsx` | `public.prayer_weeks` table | • Author weekly bulletin: title, week start date, affirmations, song lyrics<br>• Add and order daily prayer points in JSONB structure<br>• Active/archive status toggling | [ ] |
| 40| **Prayer Requests Coordinator** | `PrayerRequestsManager.tsx` | `public.prayer_requests` table | • Filter by category and status (`submitted`, `praying`, `answered`)<br>• Add official pastoral response note with timestamp and coordinator name | [ ] |
| 41| **Prayer Groups Administration** | `PrayerGroupsManager.tsx` | `prayer_groups`, `group_members` | • View all groups, creator profiles, and member rosters<br>• Delete inactive groups or reassign group moderators | [ ] |
| 42| **Pastoral Reports Review** | `ReportsManager.tsx` | `prayer_reports`, `report-uploads` (R2) | • Filter by minister, church, date range<br>• Download attached report document via secure signed URL (3600s)<br>• Review status toggle (`pending` -> `reviewed`)<br>• Export reports table to CSV | [ ] |
| 43| **Payment Settings Manager** | `PaymentSettingsManager.tsx` | `site_settings.bank_accounts` | • Add up to 10 multi-region bank accounts<br>• Configure IBAN, SWIFT, branch code, routing numbers<br>• Updates reflect immediately in user checkout modal | [ ] |
| 44| **Activity Audit Log** | `ActivityLogManager.tsx` | `public.activity_logs`, `log_activity()` trigger | • Full chronological audit log of all database mutations<br>• Displays actor email, table name, action (INSERT/UPDATE/DELETE)<br>• Inspect before/after JSON diffs of changed fields | [ ] |
| 45| **User & Role Administration** | `UsersManager.tsx` | `profiles`, `admin-create-user` Worker | • Search registered members by email and name<br>• Super-admin can provision new administrators | [ ] |

