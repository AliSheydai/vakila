import type { LawyerProfile } from '../types'

/**
 * Centralized public lawyer profile data.
 * TODO: Replace with API fetch (e.g. GET /api/public/lawyers/:slug).
 */
export const lawyerProfile: LawyerProfile = {
  lawyer: {
    id: 'lawyer-demo-1',
    fullName: 'مهدی رضایی',
    title: 'وکیل پایه یک دادگستری',
    headline: 'متخصص دعاوی ملکی، خانواده و کیفری',
    avatarUrl: null,
    initials: 'مر',
    yearsOfExperience: 14,
    verified: true,
    licenseLabel: 'پروانه وکالت تأییدشده',
  },
  credentials: [
    { id: 'cred-1', label: 'وکیل پایه یک دادگستری' },
    { id: 'cred-2', label: 'عضو کانون وکلای دادگستری' },
  ],
  specialties: [
    {
      id: 'sp-1',
      title: 'دعاوی خانواده',
      description: 'طلاق، مهریه، حضانت و نفقه',
      featured: true,
    },
    {
      id: 'sp-2',
      title: 'دعاوی کیفری',
      description: 'دفاع و پیگیری پرونده‌های کیفری',
      featured: true,
    },
    {
      id: 'sp-3',
      title: 'دعاوی ملکی',
      description: 'تصرف، الزام به تنظیم سند و اختلافات ملکی',
      featured: true,
    },
    {
      id: 'sp-4',
      title: 'دعاوی حقوقی',
      description: 'مطالبات، خسارت و اختلافات حقوقی',
      featured: true,
    },
    {
      id: 'sp-5',
      title: 'دعاوی ثبتی',
      description: 'ثبت املاک و اعتراض به عملیات ثبتی',
      featured: false,
    },
    {
      id: 'sp-6',
      title: 'دیوان عدالت اداری',
      description: 'شکایت از تصمیمات و آراء اداری',
      featured: false,
    },
    {
      id: 'sp-7',
      title: 'قراردادها',
      description: 'تنظیم، بررسی و اختلافات قراردادی',
      featured: true,
    },
    {
      id: 'sp-8',
      title: 'چک و سفته',
      description: 'وصول مطالبات و دعاوی اسناد تجاری',
      featured: false,
    },
    {
      id: 'sp-9',
      title: 'ارث و انحصار وراثت',
      description: 'تقسیم ترکه و امور مربوط به وراثت',
      featured: false,
    },
  ],
  services: [
    {
      id: 'svc-1',
      title: 'مشاوره حقوقی',
      description: 'بررسی اولیه موضوع و ارائه راهکار عملی.',
      icon: 'MessageCircle',
    },
    {
      id: 'svc-2',
      title: 'پذیرش وکالت',
      description: 'پذیرش پرونده پس از بررسی مدارک و توافق.',
      icon: 'Briefcase',
    },
    {
      id: 'svc-3',
      title: 'بررسی پرونده',
      description: 'تحلیل مدارک و ارزیابی نقاط قوت و ضعف پرونده.',
      icon: 'FileSearch',
    },
    {
      id: 'svc-4',
      title: 'تنظیم دادخواست',
      description: 'تهیه و تنظیم دادخواست متناسب با موضوع دعوا.',
      icon: 'FileText',
    },
    {
      id: 'svc-5',
      title: 'تنظیم لایحه',
      description: 'نگارش لایحه دفاعیه یا لایحه تکمیلی.',
      icon: 'PenLine',
    },
    {
      id: 'svc-6',
      title: 'تنظیم شکوائیه',
      description: 'تنظیم شکواییه برای طرح موضوع کیفری.',
      icon: 'Shield',
    },
    {
      id: 'svc-7',
      title: 'تنظیم قرارداد',
      description: 'نگارش و بازبینی قراردادهای حقوقی.',
      icon: 'ScrollText',
    },
    {
      id: 'svc-8',
      title: 'داوری و حل اختلاف',
      description: 'کمک به حل اختلاف پیش از طرح دعوا.',
      icon: 'Scale',
    },
    {
      id: 'svc-9',
      title: 'پیگیری پرونده',
      description: 'پیگیری مستمر مراحل دادرسی و اطلاع‌رسانی.',
      icon: 'Waypoints',
    },
  ],
  statistics: [
    {
      id: 'stat-1',
      label: 'سابقه وکالت',
      value: '۱۴+ سال',
      hint: 'تجربه حرفه‌ای',
    },
    {
      id: 'stat-2',
      label: 'پرونده‌ها',
      value: '۱۰۰۰+',
      hint: 'در حوزه‌های مختلف',
    },
    {
      id: 'stat-3',
      label: 'حوزه تخصصی',
      value: '۵',
      hint: 'تمرکز اصلی',
    },
    {
      id: 'stat-4',
      label: 'محدوده فعالیت',
      value: 'تهران و البرز',
      hint: 'به‌همراه مشاوره آنلاین',
    },
  ],
  whyPoints: [
    {
      id: 'why-1',
      title: 'تجربه تخصصی',
      description: 'تمرکز عملی روی حوزه‌هایی که بیشترین پرونده در آن‌ها داشته‌ام.',
      icon: 'Award',
    },
    {
      id: 'why-2',
      title: 'بررسی دقیق مدارک',
      description: 'قبل از پذیرش، مدارک و وضعیت پرونده به‌صورت شفاف ارزیابی می‌شود.',
      icon: 'FileCheck',
    },
    {
      id: 'why-3',
      title: 'راهکار شفاف',
      description: 'مسیر حقوقی، ریسک‌ها و گزینه‌های موجود به‌صورت روشن توضیح داده می‌شود.',
      icon: 'Lightbulb',
    },
    {
      id: 'why-4',
      title: 'پیگیری مستمر',
      description: 'وضعیت پرونده و مراحل بعدی به‌صورت منظم اطلاع‌رسانی می‌شود.',
      icon: 'RefreshCw',
    },
    {
      id: 'why-5',
      title: 'مشاوره آنلاین',
      description: 'امکان شروع ارتباط بدون نیاز به حضور حضوری در جلسه اول.',
      icon: 'Video',
    },
    {
      id: 'why-6',
      title: 'پرداخت توافقی',
      description: 'حق‌الوکاله و نحوه پرداخت پس از بررسی پرونده توافق می‌شود.',
      icon: 'Handshake',
    },
    {
      id: 'why-7',
      title: 'پوشش چندشهری',
      description: 'فعالیت در تهران و البرز، با امکان بررسی پرونده‌های سایر شهرها.',
      icon: 'MapPinned',
    },
    {
      id: 'why-8',
      title: 'ارتباط مستقیم',
      description: 'مسیر ارتباط با وکیل مشخص و بدون واسطه غیرضروری است.',
      icon: 'MessagesSquare',
    },
  ],
  // Empty by default — do not invent fake case studies.
  caseStudies: [],
  processSteps: [
    {
      id: 'step-1',
      step: 1,
      title: 'درخواست مشاوره یا پذیرش پرونده',
      description: 'نوع درخواست خود را مشخص کنید و اطلاعات اولیه را ارسال کنید.',
    },
    {
      id: 'step-2',
      step: 2,
      title: 'ارسال مدارک و اطلاعات پرونده',
      description: 'مدارک موجود و شرح مختصر موضوع را برای بررسی اولیه بفرستید.',
    },
    {
      id: 'step-3',
      step: 3,
      title: 'بررسی اولیه توسط وکیل',
      description: 'مدارک و امکان پذیرش پرونده ارزیابی می‌شود.',
    },
    {
      id: 'step-4',
      step: 4,
      title: 'مشاوره و توافق درباره نحوه همکاری',
      description: 'مسیر کار، زمان‌بندی و شرایط همکاری شفاف می‌شود.',
    },
    {
      id: 'step-5',
      step: 5,
      title: 'شروع پیگیری پرونده',
      description: 'پس از توافق، پیگیری حقوقی پرونده آغاز می‌شود.',
    },
  ],
  consultation: {
    available: true,
    statusLabel: 'آماده دریافت درخواست مشاوره',
    onlineAvailable: true,
    note: 'پس از ثبت درخواست، زمان بررسی اولیه به شما اعلام می‌شود.',
  },
  pricing: {
    consultationFeeLabel: null,
    feePolicy:
      'حق‌الوکاله پس از بررسی پرونده و توافق طرفین تعیین می‌شود.',
    installmentAvailable: true,
    paymentNotes: [
      'هزینه مشاوره بر اساس موضوع و حجم بررسی اعلام می‌شود.',
      'امکان پرداخت اقساطی در برخی پرونده‌ها پس از توافق وجود دارد.',
      'قبل از شروع همکاری، شرایط پرداخت شفاف خواهد بود.',
    ],
  },
  locations: {
    cities: ['تهران', 'البرز'],
    officeAddress: 'تهران، خیابان ولیعصر، نرسیده به پارک ساعی',
    onlineConsultation: true,
    otherCitiesSupported: true,
    otherCitiesNote:
      'پذیرش پرونده در سایر شهرها پس از بررسی امکان‌پذیری انجام می‌شود.',
  },
  availability: {
    responseHint: 'پاسخ اولیه معمولاً در کمتر از یک روز کاری',
    workingHours: 'شنبه تا چهارشنبه، ۹ تا ۱۸',
  },
  faq: [
    {
      id: 'faq-1',
      question: 'آیا مشاوره آنلاین انجام می‌شود؟',
      answer:
        'بله. امکان مشاوره آنلاین برای بررسی اولیه موضوع وجود دارد و نیازی به حضور حضوری در جلسه اول نیست.',
    },
    {
      id: 'faq-2',
      question: 'آیا امکان پرداخت اقساطی وجود دارد؟',
      answer:
        'در برخی پرونده‌ها، پس از بررسی موضوع و توافق طرفین، امکان پرداخت اقساطی فراهم است.',
    },
    {
      id: 'faq-3',
      question: 'آیا پرونده خارج از شهر محل دفتر پذیرفته می‌شود؟',
      answer:
        'بسته به نوع پرونده و امکان پیگیری، پرونده‌های سایر شهرها نیز قابل بررسی هستند.',
    },
    {
      id: 'faq-4',
      question: 'برای بررسی پرونده چه مدارکی لازم است؟',
      answer:
        'معمولاً شرح مختصر موضوع، مدارک هویتی مرتبط، قراردادها، آراء یا ابلاغیه‌های موجود و هر سند مرتبط دیگر کافی است. فهرست دقیق پس از ثبت درخواست اعلام می‌شود.',
    },
    {
      id: 'faq-5',
      question: 'آیا قبل از پذیرش، پرونده بررسی می‌شود؟',
      answer:
        'بله. پیش از پذیرش وکالت، مدارک و وضعیت پرونده بررسی می‌شود تا امکان همکاری و مسیر حقوقی روشن باشد.',
    },
    {
      id: 'faq-6',
      question: 'هزینه مشاوره چگونه تعیین می‌شود؟',
      answer:
        'هزینه مشاوره بر اساس موضوع، پیچیدگی و میزان بررسی موردنیاز مشخص می‌شود و پیش از جلسه به شما اعلام خواهد شد.',
    },
    {
      id: 'faq-7',
      question: 'آیا امکان درخواست وکیل فوری وجود دارد؟',
      answer:
        'درخواست‌های فوری بررسی می‌شوند؛ اما پذیرش قطعی به ظرفیت زمانی و نوع پرونده بستگی دارد.',
    },
  ],
}

export const brandName = 'وکالا'
