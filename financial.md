# Phase 6 — پیاده‌سازی فرانت‌اند ماژول «مالی»

## هدف

در این فاز باید ماژول **مالی** برای داشبورد وکیل (ادمین) طراحی و پیاده‌سازی شود.

مسیر فعلی `/admin/financial` فقط یک `SectionPlaceholder` است.
Sidebar هم از قبل گزینه **مالی** دارد.

هدف این ماژول ساخت یک **مرکز عملیات مالی وکیل** است؛ نه تکرار صفحه آمارها.

تفاوت با ماژول آمارها:

| آمارها (`/admin/stats`) | مالی (`/admin/financial`) |
|---|---|
| تحلیل عملکرد کاری | دفتر کل و جریان پول |
| KPI ترکیبی (موکل، پرونده، رویداد، درآمد) | KPI مالی خالص (دریافت، هزینه، مالیات، سود، طلب) |
| روند و توزیع | تراکنش‌به‌تراکنش |
| Insightهای عملکردی | خروجی Excel / گزارش مالی |

این بخش نباید فقط چند کارت مثل:

```text
دریافتی ماه
پرداختی ماه
مانده
```

باشد.

ماژول مالی باید بتواند:

* تمام تراکنش‌های مرتبط با پرونده‌ها را یکجا نشان دهد
* مالیات و سود را شفاف محاسبه کند
* KPIهای مالی معنادار بدهد
* با فیلتر بازه زمانی کار کند
* خروجی Excel قابل استفاده حسابداری/شخصی بدهد

هدف اصلی:

> وکیل بتواند با انتخاب بازه زمانی، تمام ورود و خروج پول، مالیات، سود و طلب‌ها را ببیند و در صورت نیاز گزارش Excel بگیرد.

---

# 1. محدودیت‌های فعلی

همانند فازهای قبلی:

* Backend نداریم.
* Database نداریم.
* API واقعی نداریم.
* Prisma نداریم.
* احراز هویت سمت سرور نداریم.
* پرداخت واقعی / درگاه واقعی نداریم.
* Notification واقعی نداریم.

داده‌ها فعلاً در Frontend و `localStorage` مدیریت می‌شوند.

سیستم احراز هویت فعلی پروژه حفظ شود.

ماژول Financial نباید به API یا Backend فرضی وابسته شود.

معماری باید برای اتصال Backend در آینده آماده باشد.

---

# 2. وضعیت فعلی پروژه (زمینه واقعی)

قبل از طراحی، این واقعیت‌های پروژه را جدی بگیر:

### مسیر و Sidebar

* مسیر `/admin/financial` از قبل وجود دارد.
* `FinancialPage` فعلاً Placeholder است.
* گزینه Sidebar با عنوان **مالی** و آیکون `Wallet` موجود است.
* نیازی به ساخت مسیر یا آیتم Sidebar جدید نیست؛ باید Placeholder را به ماژول واقعی تبدیل کنی.

### Data Sourceهای واقعی موجود

از ماژول Cases:

```text
Case
├── fee
├── payments[]
└── expenses[]
```

Payment فعلی:

```text
id
amount
date
method
source
status          // completed | pending | failed
description?
externalTransactionId?
createdAt
updatedAt
```

Expense فعلی:

```text
id
title
category        // court | expert | travel | service | other
amount
date
description?
createdAt
updatedAt
```

همچنین:

* `Client` مستقل وجود دارد (`clientId` روی Case)
* `getCaseFinancialSummary` در Cases موجود است
* تب مالی داخل جزئیات پرونده (`CaseFinanceTab`) برای ثبت Fee / Payment / Expense وجود دارد
* ماژول Stats قبلاً Date Range و Aggregation درآمد را دارد

### چیزهایی که فعلاً وجود ندارد

* فیلد مالیات روی Payment / Expense / Case
* موجودیت مستقل Transaction
* Invoice / صورتحساب رسمی
* Refund
* وابستگی Excel (`xlsx` / `exceljs` و مشابه)
* صفحه مالی سراسری (Ledger)

این‌ها را در این فاز با معماری تمیز و سازگار با داده فعلی حل کن؛ داده جعلی نساز.

---

# 3. بررسی معماری قبل از شروع

قبل از هر تغییر کد:

* ساختار `features/financial` را بررسی کن.
* `features/cases` را بررسی کن (types، store، finance utils، CaseFinanceTab).
* `features/clients` را بررسی کن.
* `features/stats` را بررسی کن (Date Range، Aggregation، Format، Service Pattern).
* نحوه Local Storage و Storeهای Cases/Clients را بررسی کن.
* کتابخانه‌های تاریخ/عدد/پول موجود را بررسی کن.
* وابستگی‌های `package.json` را برای Export بررسی کن.
* قبل از نصب dependency جدید، گزینه‌های موجود را بسنج.

در این مرحله فقط تحلیل کن.

هیچ تغییر عمده‌ای انجام نده.

در پایان گزارش بده و منتظر تأیید بمان.

---

# 4. مسیر

مسیر نهایی:

```text
/admin/financial
```

عنوان Sidebar:

```text
مالی
```

آیکون فعلی (`Wallet`) حفظ شود مگر اینکه با بقیه Sidebar ناهماهنگ باشد.

---

# 5. مفهوم Financial

Financial یک Entity مستقل مانند Client یا Case نیست.

این ماژول یک **Finance Layer / Ledger Layer** روی داده‌های موجود است.

معماری مفهومی:

```text
Cases.fee
Cases.payments
Cases.expenses
Clients
       ↓
Financial Service (Aggregation + Tax + Profit + Ledger)
       ↓
KPI / Charts / Transactions Table / Excel Export
```

قوانین معماری:

* Componentها نباید مستقیماً از Local Storage بخوانند.
* منبع حقیقت پرداخت/هزینه همان Cases Store باقی بماند.
* داده Payment و Expense را در Store جداگانه کپی/Duplicate نکن.
* Financial Service باید از Cases + Clients بخواند و View Model بسازد.
* در آینده بتوان همان Service را به API وصل کرد بدون بازنویسی UI.

---

# 6. مدل مفهومی تراکنش (Ledger Row)

برای نمایش یکدست، همه ردیف‌های مالی را به یک View Model نرمال‌سازی کن:

```text
FinancialTransaction
├── id
├── kind                 // payment | expense
├── direction            // inflow | outflow
├── amount
├── taxAmount
├── netAmount
├── date
├── status?              // برای payment
├── method?              // برای payment
├── category?            // برای expense
├── description?
├── caseId
├── caseTitle
├── caseNumber
├── clientId?
├── clientName?
└── sourceRef            // paymentId / expenseId
```

نکات:

* این مدل فقط برای لایه مالی است؛ لزوماً نباید در Local Storage جدا ذخیره شود.
* `kind = payment` = دریافت از موکل (ورود پول) — فقط وقتی وضعیت اجازه دهد.
* `kind = expense` = هزینه پرونده (خروج پول).
* Fee حق‌الزحمه توافق‌شده است، نه تراکنش نقدی. Fee را در Ledger تراکنش‌ها قاطی نکن؛ در KPI طلب/مانده استفاده کن.

---

# 7. مالیات و سود (تصمیم دامنه)

در پروژه فعلاً فیلد Tax وجود ندارد.
برای این فاز یک مدل ساده، شفاف و قابل توسعه تعریف کن.

## 7.1 مالیات

پیشنهاد پیش‌فرض (قابل تأیید در Phase 6.1):

```text
مالیات = درصد قابل تنظیم از مبلغ پرداخت‌های موفق
```

مثال:

```text
taxRate = 0.09   // ۹٪
taxAmount = amount * taxRate
netAmount = amount - taxAmount
```

قوانین:

* مالیات فقط روی Paymentهای `completed` اعمال شود.
* Pending / Failed مالیات نخورند و وارد درآمد قطعی نشوند.
* Expense به صورت پیش‌فرض مالیات جداگانه نداشته باشد مگر اینکه بعداً مدل گسترش یابد.
* نرخ مالیات باید در یک نقطه مرکزی قابل تغییر باشد (مثلاً constant / settings محلی ماژول).
* نرخ را Hardcode پراکنده داخل Componentها ننویس.
* در UI نرخ فعال را شفاف نشان بده (مثلاً «مالیات محاسبه‌شده با نرخ ۹٪»).

اگر در Phase 6.1 به مدل بهتری رسیدی (مثلاً مالیات روی Fee یا مالیات دستی per payment)، اول پیشنهاد بده و تأیید بگیر.

## 7.2 سود

تعریف پیشنهادی برای بازه انتخاب‌شده:

```text
Gross Revenue   = مجموع Paymentهای completed در بازه
Tax Total       = مجموع taxAmount همان Paymentها
Net Revenue     = Gross Revenue - Tax Total
Expenses Total  = مجموع Expenseها در بازه
Profit          = Net Revenue - Expenses Total
```

یا اگر تأیید شد که مالیات جدا گزارش شود ولی از سود کم نشود:

```text
Profit = Gross Revenue - Expenses Total
```

در Phase 6.1 یکی را انتخاب و با دلیل پیشنهاد کن.
پیش‌فرض پیشنهادی همین است:

```text
Profit = (Gross Revenue - Tax) - Expenses
```

## 7.3 طلب / مانده

از Fee و Paymentهای completed محاسبه شود:

```text
Receivables = Σ max(0, fee - paidCompleted) برای پرونده‌ها
```

این شاخص می‌تواند:

* Global باشد (کل طلب فعلی)، یا
* در صورت امکان منطقی، نسبت به بازه تفسیر شود

اگر تفسیر بازه‌ای برای طلب گمراه‌کننده است، طلب را به عنوان KPI وضعیت جاری (Current Snapshot) نشان بده و در UI برچسب مناسب بگذار.

---

# 8. انتخاب بازه زمانی

مهم‌ترین فیلتر صفحه، بازه زمانی است.

حداقل Presetها (هماهنگ با Stats):

* امروز
* این هفته
* این ماه
* سه ماه اخیر
* امسال
* سال گذشته
* بازه دلخواه

همچنین:

**از تاریخ** تا **تا تاریخ**

قوانین:

* تمام KPIها، جدول تراکنش‌ها، Chartها و Excel بر اساس همین بازه باشند.
* منطق Date Range را در صورت امکان از Stats reuse یا extract مشترک کن؛ Duplicate بی‌دلیل نکن.
* اگر extract مشترک سنگین است، در این فاز منطق مشابه و سازگار پیاده کن و بعداً refactor پیشنهاد بده.
* تاریخ‌ها فارسی / جلالی و RTL باشند؛ از الگوی موجود پروژه پیروی کن.

---

# 9. رفتار تغییر فیلتر

وقتی کاربر بازه یا فیلترها را تغییر می‌دهد:

* KPIها به‌روز شوند
* جدول تراکنش‌ها به‌روز شود
* Chartها به‌روز شوند
* خروجی Excel همان فیلتر فعلی را منعکس کند
* Loading / Transition مناسب داشته باشد

اگر برای بازه داده‌ای نبود، صفحه خراب نشود.
Empty State مناسب نمایش بده.

---

# 10. KPIهای اصلی

در ابتدای صفحه چند KPI مهم نمایش بده.
از تعداد زیاد Card پرهیز کن.

حداقل KPIهای پیشنهادی:

### درآمد ناخالص

مجموع Paymentهای `completed` در بازه.

### مالیات

مجموع مالیات محاسبه‌شده همان درآمد.

### درآمد خالص

```text
Gross - Tax
```

### هزینه‌ها

مجموع Expenseها در بازه.

### سود

```text
Net Revenue - Expenses
```

### طلب موکلین

مانده پرداخت‌نشده بر اساس Fee و پرداخت‌های completed.

اختیاری اگر جا داشت و شلوغ نشد:

* تعداد تراکنش‌های موفق
* میانگین مبلغ دریافت
* نسبت هزینه به درآمد

قوانین KPI:

* فقط از داده واقعی محاسبه شود.
* Pending/Failed در درآمد قطعی نیاید.
* مقایسه با دوره قبل اگر پیاده‌سازی شد، مثل Stats باشد و درصد نامعتبر نشان داده نشود.

---

# 11. فیلترهای جدول تراکنش‌ها

علاوه بر Date Range، حداقل این فیلترها را داشته باش:

* جستجو (عنوان پرونده، شماره پرونده، نام موکل، توضیحات)
* نوع تراکنش: همه / دریافت / هزینه
* وضعیت پرداخت: همه / موفق / در انتظار / ناموفق (برای payment)
* روش پرداخت
* دسته‌بندی هزینه
* موکل
* پرونده

فیلترها باید ترکیب‌پذیر باشند.

اگر فیلتر نتیجه خالی داد، Empty State مخصوص فیلتر نشان بده؛ با Empty State «اصلاً تراکنشی نیست» یکی نباشد.

---

# 12. جدول تراکنش‌ها

قلب صفحه مالی، جدول/لیست تراکنش‌هاست.

ستون‌های پیشنهادی:

* تاریخ
* نوع (دریافت / هزینه)
* مبلغ
* مالیات
* خالص
* وضعیت / روش یا دسته‌بندی
* پرونده
* موکل
* توضیحات

رفتارها:

* مرتب‌سازی پیش‌فرض: جدیدترین تاریخ بالا
* امکان Sort روی تاریخ و مبلغ اگر با الگوی جدول‌های پروژه سازگار است
* کلیک روی پرونده → `/admin/cases/[caseId]`
* کلیک روی موکل → `/admin/clients/[clientId]` در صورت وجود
* در Mobile به Card/List فشرده تبدیل شود؛ جدول Desktop را کورکورانه در موبایل نشکن
* اعداد پولی با فرمت فارسی/`formatMoney` موجود پروژه

جزئیات تراکنش:

* Sheet یا Drawer برای دیدن جزئیات کامل یک ردیف
* نیازی به CRUD کامل داخل صفحه مالی نیست؛ ثبت/ویرایش اصلی همان تب مالی پرونده است
* در صورت UX خوب، دکمه «ثبت دریافت» / «ثبت هزینه» می‌تواند به ایجاد سریع با انتخاب پرونده منجر شود — اختیاری و نیازمند تأیید در Phase 6.1

---

# 13. Charts مالی

حداکثر ۲ تا ۳ Chart مفید؛ شلوغ نکن.

پیشنهادی:

### روند جریان نقدی

دریافت‌ها و هزینه‌ها در طول زمان (دو سری یا دو حالت واضح).

### ترکیب سود

مثلاً Stack/Bar ساده از:

```text
درآمد ناخالص | مالیات | هزینه | سود
```

یا Donut برای سهم هزینه/مالیات از درآمد — فقط اگر خوانا باشد.

محور زمان Dynamic باشد (مثل Stats):

* بازه کوتاه → روزانه
* بازه بلند → ماهانه

از Chart Library موجود پروژه استفاده کن.
قبل از نصب library جدید، وابستگی‌های فعلی را بررسی کن.

---

# 14. خروجی Excel

یکی از Deliverableهای اصلی این فاز است.

کاربر باید بتواند گزارش بازه فیلترشده را Export کند.

حداقل Sheet پیشنهادی:

### 1) تراکنش‌ها

ستون‌ها:

* تاریخ
* نوع
* مبلغ
* مالیات
* خالص
* وضعیت
* روش/دسته
* شماره پرونده
* عنوان پرونده
* موکل
* توضیحات

### 2) خلاصه

* بازه زمانی
* درآمد ناخالص
* مالیات
* درآمد خالص
* هزینه‌ها
* سود
* تعداد دریافت‌ها
* تعداد هزینه‌ها
* نرخ مالیات

قوانین Export:

* فقط داده‌های فیلتر فعلی Export شوند.
* نام فایل معنادار باشد، مثلاً:

```text
vakila-financial-1404-06-01_1404-06-31.xlsx
```

* در صورت نبود library، یکی از گزینه‌های سبک و رایج را بعد از بررسی `package.json` پیشنهاد و در Phase مربوطه اضافه کن.
* اگر Excel واقعی سنگین بود، حداقل CSV UTF-8 با BOM برای Excel فارسی قابل قبول است؛ اما اولویت با `.xlsx` واقعی است.
* Export نباید UI را قفل کند؛ برای داده زیاد، feedback مناسب بده.
* اعداد را طوری Export کن که در Excel قابل جمع‌زدن باشند (عدد خام + نمایش فارسی در UI).

---

# 15. صفحه اصلی — ساختار پیشنهادی

صفحه `/admin/financial` از بالا به پایین:

1. Header
   * عنوان: مالی
   * توضیح کوتاه
   * دکمه خروجی Excel
2. Date Range + Filters
3. KPI Section
4. Charts (جمع‌وجور)
5. Transactions Table / List
6. Empty / Loading / Error states

الهام بصری از Stats و Cases گرفته شود، اما هویت «دفتر مالی» حفظ شود.
کپی UI آمارها ممنوع است؛ الگو و Design System مشترک باشد.

---

# 16. States

حداقل این حالت‌ها را پوشش بده:

* Loading اولیه / تغییر بازه
* Empty: هیچ Case/Payment/Expenseای در سیستم نیست
* Empty filtered: فیلتر نتیجه ندارد
* Error: اگر aggregation شکست خورد
* Success with data

صفحه نباید به خاطر یک Section خالی از کار بیفتد.

---

# 17. ارتباط با سایر ماژول‌ها

```text
Cases  ──payments/expenses/fee──▶ Financial
Clients ──names/lookup──────────▶ Financial
Stats   ──shared date/money utils (optional reuse)
Case Detail Finance Tab ──source of truth for mutations
```

قوانین:

* Financial در این فاز اساساً Read/Aggregate/Export است.
* Mutation اصلی در CaseFinanceTab می‌ماند مگر تأیید خلاف آن داده شود.
* اگر Payment در پرونده اضافه/حذف شد، صفحه مالی بعد از بازگشت باید داده به‌روز نشان دهد (همان Store).
* از Stats فقط الگو و در صورت نیاز utility مشترک بگیر؛ مسئولیت دامنه را قاطی نکن.

---

# 18. TypeScript / Domain Types

در `features/financial` Typeهای مناسب بساز، حداقل:

* `FinancialDateRange`
* `FinancialPreset`
* `FinancialTransaction`
* `FinancialKpi`
* `FinancialSummary`
* `FinancialFilters`
* `FinancialExportPayload`
* `TaxConfig`

از `any` پرهیز کن.
از Types موجود Cases/Clients reuse کن؛ Type تکراری متناقض نساز.

---

# 19. ساختار پیشنهادی فایل‌ها

الهام از Stats/Events:

```text
features/financial/
  index.tsx
  types/
  services/
    financial-service.ts
    tax.ts
    export.ts
  hooks/
    use-financial.ts
  components/
    financial-header.tsx
    financial-date-range.tsx
    financial-filters.tsx
    financial-kpi-section.tsx
    financial-charts-section.tsx
    financial-transactions-table.tsx
    financial-transaction-details.tsx
    financial-empty-state.tsx
    financial-loading-state.tsx
    financial-error-state.tsx
  utils/
    format.ts
```

این ساختار پیشنهادی است؛ اگر الگوی فعلی پروژه ایجاب کرد، با همان conventionها منطبق شو.

---

# 20. Service Layer

`financial-service` حداقل این مسئولیت‌ها را داشته باشد:

* ساخت Date Range از Preset / Custom
* جمع‌آوری Payment و Expense از Cases
* نرمال‌سازی به `FinancialTransaction`
* اعمال فیلترها
* محاسبه Tax
* محاسبه Summary / KPI
* آماده‌سازی Timeline برای Chart
* آماده‌سازی داده Export

UI فقط نتیجه Service/Hook را نمایش دهد.

---

# 21. UX و محتوا

* تمام Labelها فارسی باشند
* RTL کامل
* Currency و اعداد فارسی/تابولار مطابق پروژه
* از اصطلاحات حسابداری سنگین و مبهم پرهیز کن مگر با توضیح کوتاه
* سود منفی را واضح و بدون Panic UI نشان بده
* مالیات را «محاسبه‌شده» معرفی کن تا با مالیات قطعی رسمی اشتباه نشود
* دکمه Excel در Desktop و Mobile در دسترس باشد

---

# 22. چیزهایی که نباید انجام دهی

* Backend / Prisma / API جعلی
* Duplicate کردن Payments در Local Storage جدا
* ساخت داده Fake برای قشنگ‌شدن Dashboard
* تبدیل Financial به کپی Stats
* افزودن Invoice/Accounting پیچیده خارج از Scope
* نصب چند library سنگین بدون نیاز
* شکستن CaseFinanceTab موجود
* Commit خودکار مگر درخواست صریح کاربر

---

# 23. Scope این فاز / خارج از Scope

## داخل Scope

* تبدیل Placeholder مالی به ماژول واقعی
* Ledger تراکنش‌ها (Payment + Expense)
* Tax و Profit
* KPI مالی
* Date Range + Filters
* Charts ساده مالی
* Excel Export
* Drill-down به Case/Client
* Architecture آماده Backend

## خارج از Scope (مگر تأیید جداگانه)

* درگاه پرداخت واقعی
* صدور فاکتور رسمی مالیاتی
* حسابداری دوطرفه
* حقوق و دستمزد
* چند ارزی
* اتصال به نرم‌افزارهای حسابداری خارجی
* CRUD کامل مستقل از صفحه پرونده (مگر تأیید)

---

# 24. معیار پذیرش

ماژول وقتی Done است که:

1. `/admin/financial` دیگر Placeholder نباشد.
2. وکیل بتواند بازه زمانی انتخاب کند.
3. تمام دریافت‌ها و هزینه‌های واقعی سیستم در جدول دیده شوند.
4. مالیات و سود با فرمول تأییدشده محاسبه شوند.
5. KPIها با فیلتر بازه هم‌خوان باشند.
6. خروجی Excel از داده‌های فیلترشده ساخته شود.
7. لینک به پرونده/موکل کار کند.
8. Refresh صفحه داده‌های Cases را حفظ کند.
9. RTL / فارسی / Responsive درست باشد.
10. بدون داده جعلی کار کند.

---

# 25. مراحل اجرا

## Phase 6.1 — بررسی معماری

* بررسی `features/financial` فعلی
* بررسی Cases (payments/expenses/fee/store/utils)
* بررسی Clients
* بررسی Stats (date range, aggregation, charts, format)
* بررسی CaseFinanceTab
* بررسی Sidebar و Route
* بررسی وابستگی‌های Export
* تعیین مدل Tax / Profit
* تعیین Architecture ماژول مالی
* مشخص کردن reuse در برابر duplicate نسبت به Stats

هیچ تغییر عمده‌ای انجام نده.

در پایان گزارش بده و متوقف شو.

خروجی گزارش Phase 6.1 باید شامل این‌ها باشد:

1. خلاصه وضعیت فعلی
2. Data Sourceهای قابل استفاده
3. Metricهای قابل محاسبه / غیرقابل محاسبه
4. پیشنهاد فرمول Tax و Profit
5. Architecture پیشنهادی
6. لیست فایل‌هایی که احتمالاً تغییر می‌کنند
7. تصمیم‌های نیازمند تأیید
8. توقف کامل

---

## Phase 6.2 — Financial Domain

* Types
* Tax config/logic
* Financial Service
* Date Range logic
* Aggregation / Summary
* Ledger normalization
* Filters logic

با داده واقعی Cases تست کن.
سپس متوقف شو.

---

## Phase 6.3 — صفحه اصلی + KPI

* جایگزینی Placeholder
* Header
* Date Range
* KPI Section
* Layout اصلی
* Loading / Empty / Error

سپس متوقف شو.

---

## Phase 6.4 — جدول تراکنش‌ها + فیلترها

* Transactions table/list
* Search/filters
* Details sheet/drawer
* Navigation به Case/Client
* Empty filtered state

سپس متوقف شو.

---

## Phase 6.5 — Charts

* Cashflow / revenue-expense trend
* خلاصه ترکیب مالی در صورت نیاز
* محور زمان Dynamic
* Empty chart state

سپس متوقف شو.

---

## Phase 6.6 — Excel Export

* انتخاب/افزودن library در صورت نیاز
* ساخت workbook/CSV
* Sheet تراکنش‌ها + خلاصه
* نام فایل مناسب
* دکمه Export و feedback UI
* تست با داده فارسی

سپس متوقف شو.

---

## Phase 6.7 — UI/UX و Responsive

کل ماژول را از نظر:

* UX
* RTL
* فارسی
* Responsive
* Accessibility
* Visual consistency با Admin
* خوانایی اعداد و جدول
* Loading / Empty / Error

بررسی و اصلاح کن.
سپس متوقف شو.

---

## Phase 6.8 — تست نهایی

حداقل این سناریوها را تست کن:

1. ورود به `/admin/financial`
2. نمایش صحیح صفحه به‌جای Placeholder
3. انتخاب Presetهای بازه زمانی
4. انتخاب بازه دلخواه
5. به‌روزرسانی KPI با تغییر بازه
6. صحت Gross / Tax / Net / Expenses / Profit
7. عدم محاسبه Pending/Failed به عنوان درآمد قطعی
8. نمایش جدول دریافت‌ها و هزینه‌ها
9. Search
10. فیلتر نوع تراکنش
11. فیلتر وضعیت / روش / دسته
12. Empty state بدون داده
13. Empty state فیلترشده
14. Drill-down به پرونده
15. Drill-down به موکل
16. Export Excel و باز شدن صحیح فایل
17. همخوانی Excel با فیلتر فعلی
18. افزودن Payment از Case Detail و مشاهده در مالی
19. افزودن Expense از Case Detail و مشاهده در مالی
20. Refresh صفحه
21. Desktop / Tablet / Mobile
22. RTL و تاریخ فارسی
23. Accessibility اولیه

---

# 26. قانون توقف

بعد از هر Phase:

1. کارهای انجام‌شده را گزارش کن.
2. فایل‌های تغییرکرده را اعلام کن.
3. تست‌های انجام‌شده را اعلام کن.
4. مشکلات احتمالی را اعلام کن.
5. تصمیم‌های نیازمند تأیید را مشخص کن.
6. سپس متوقف شو.

بدون تأیید من وارد Phase بعدی نشو.

اگر در حین توسعه به قابلیت یا تصمیمی رسیدی که در این Master Prompt مشخص نشده و روی:

* Architecture
* UX
* Data Model
* Tax/Profit Formula
* Scope
* Performance

اثر دارد، ابتدا آن را مطرح کن.

---

# هدف نهایی

در پایان این فاز باید یک ماژول **«مالی»** داشته باشیم که:

* Placeholder نباشد
* مرکز مشاهده تراکنش‌های مالی وکیل باشد
* دریافت‌ها و هزینه‌ها را یکجا نشان دهد
* مالیات و سود را شفاف محاسبه کند
* KPIهای مالی بدهد
* فیلتر بازه زمانی داشته باشد
* فیلتر و جستجوی تراکنش داشته باشد
* خروجی Excel بدهد
* از داده واقعی Cases استفاده کند
* داده را Duplicate نکند
* کاملاً فارسی و RTL باشد
* Responsive و Accessible باشد
* برای اتصال Backend آینده آماده باشد

هدف اصلی:

> **وکیل با ورود به بخش مالی باید بتواند در یک نگاه بفهمد در این بازه چقدر گرفته، چقدر هزینه کرده، چقدر مالیات خورده، چقدر سود مانده، و گزارشش را Excel بگیرد.**

---

# اکنون فقط Phase 6.1 را اجرا کن

در Phase 6.1 فقط:

* معماری پروژه را بررسی کن.
* ماژول Financial فعلی را بررسی کن.
* Cases / Payments / Expenses / Fee را بررسی کن.
* Clients را بررسی کن.
* Stats را از نظر reuse بررسی کن.
* CaseFinanceTab را بررسی کن.
* امکان Export را بررسی کن.
* فرمول Tax و Profit را پیشنهاد بده.
* Architecture پیشنهادی Financial را ارائه کن.

**هیچ تغییر عمده‌ای در کد انجام نده.**

پس از پایان Phase 6.1:

1. خلاصه بررسی را گزارش کن.
2. Data Sourceهای موجود را اعلام کن.
3. Metricهای قابل محاسبه / غیرقابل محاسبه را مشخص کن.
4. پیشنهاد Tax / Profit را با دلیل بنویس.
5. Architecture پیشنهادی را توضیح بده.
6. فایل‌هایی که در Phaseهای بعدی احتمالاً تغییر می‌کنند را اعلام کن.
7. تصمیم‌های نیازمند تأیید را مشخص کن.
8. سپس کاملاً متوقف شو.

**بدون تأیید من وارد Phase 6.2 نشو.**
