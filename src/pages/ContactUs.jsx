import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Phone,
  Clock,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Search,
  HelpCircle,
  Sparkles,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { SEOHead } from '../components/common/SEOHead';
import { apiClient } from '../lib/apiClient';
import { WomanAiIcon } from '../components/common/WomanAiIcon';

let cachedContactInfo = null;

// Initial baseline FAQs for instantaneous zero-wait rendering
const INITIAL_FAQS = [
  {
    id: 8,
    question: "What materials and craftsmanship techniques are used in your collections?",
    answer: "Our pieces are handcrafted using premium mulberry silks, French laces, fine satins, and artisanal hand-embroidery created in collaboration with master Indian artisans.",
    category: "Atelier & Craftsmanship",
    display_order: 1
  },
  {
    id: 9,
    question: "How should I care for my House of Urvaah luxury garments?",
    answer: "Given the delicate fabrics and intricate handwork, we strongly advise professional dry cleaning only. Store corsets and evening wear in our breathable cotton garment bags away from direct sunlight.",
    category: "Atelier & Craftsmanship",
    display_order: 2
  },
  {
    id: 1,
    question: "How long will it take to receive my House of Urvaah order?",
    answer: "Standard domestic delivery arrives within 3–5 business days. Express boutique shipping takes 1–2 business days. For bespoke or made-to-measure couture pieces, craftsmanship requires 7–14 business days before dispatch.",
    category: "Orders & Shipping",
    display_order: 1
  },
  {
    id: 2,
    question: "How can I track my shipment?",
    answer: "Once your order leaves our atelier, you will receive an SMS and email notification with an exclusive courier tracking link. You can also view live tracking updates via your Account page or by querying Urvaah Bot.",
    category: "Orders & Shipping",
    display_order: 2
  },
  {
    id: 3,
    question: "Do you offer international worldwide shipping?",
    answer: "Yes, House of Urvaah ships internationally via DHL Express. Delivery typically takes 5–8 business days depending on destination customs clearance.",
    category: "Orders & Shipping",
    display_order: 3
  },
  {
    id: 10,
    question: "Which payment methods are accepted?",
    answer: "We accept all major Credit/Debit Cards (Visa, MasterCard, Amex), UPI (Google Pay, PhonePe, Paytm), Net Banking, and Cash on Delivery (COD) for eligible domestic pin codes.",
    category: "Payments & Security",
    display_order: 1
  },
  {
    id: 11,
    question: "Is my online payment transaction secure?",
    answer: "All transactions are encrypted with 256-bit SSL protocols and processed through RBI-approved, PCI-DSS Level 1 compliant payment gateways. We never store your sensitive card or banking credentials.",
    category: "Payments & Security",
    display_order: 2
  },
  {
    id: 7,
    question: "How do I initiate a return or exchange?",
    answer: "You can initiate an exchange or return directly through your Account under \"My Orders\", or contact our Concierge team. Our courier partner will arrange a doorstep inspection and reverse pickup.",
    category: "Returns & Exchanges",
    display_order: 2
  }
];

const INITIAL_CATEGORIES = [
  'All',
  'Atelier & Craftsmanship',
  'Orders & Shipping',
  'Payments & Security',
  'Returns & Exchanges'
];

// Module-level in-memory cache to persist across client-side router navigations
let cachedFaqsList = null;
let cachedCategoriesList = null;

export const ContactUs = () => {
  // Contact Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Order Inquiry',
    message: '',
  });
  const [phoneError, setPhoneError] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Dynamic FAQs State (Instantaneous render + background revalidation)
  const [faqs, setFaqs] = useState(() => cachedFaqsList || INITIAL_FAQS);
  const [categories, setCategories] = useState(() => cachedCategoriesList || INITIAL_CATEGORIES);
  const [activeCategory, setActiveCategory] = useState('All');
  const [faqSearch, setFaqSearch] = useState('');
  const [expandedId, setExpandedId] = useState(() => (cachedFaqsList?.[0]?.id || 8));
  const [isLoadingFaqs, setIsLoadingFaqs] = useState(false);
  const [faqError, setFaqError] = useState(null);

  const location = useLocation();
  const hasScrolledToFaq = useRef(false);

  // Smoothly scroll to FAQs only when arriving at /faqs, /faq or #faqs without resetting scroll on browse
  useEffect(() => {
    const isFaqTarget =
      location.pathname === '/faqs' ||
      location.pathname === '/faq' ||
      location.hash === '#faqs';

    if (isFaqTarget && !hasScrolledToFaq.current) {
      hasScrolledToFaq.current = true;
      const scrollTimer = setTimeout(() => {
        const el = document.getElementById('faqs');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 120);
      return () => clearTimeout(scrollTimer);
    }
  }, [location.pathname, location.hash]);

  // Fetch Live FAQs in background without causing layout shifts or scroll jumping
  const fetchFAQs = async () => {
    try {
      const res = await apiClient('/api/faqs');
      if (res?.success) {
        const list = Array.isArray(res.all) ? res.all : (Array.isArray(res.data) ? res.data : []);
        if (list.length > 0) {
          cachedFaqsList = list;
          setFaqs(list);

          // Derive unique categories
          const rawCats = Array.isArray(res.categories) && res.categories.length > 0
            ? res.categories
            : Array.from(new Set(list.map((item) => item.category).filter(Boolean)));

          const derived = ['All', ...rawCats];
          cachedCategoriesList = derived;
          setCategories(derived);

          // Auto-expand first item if none selected yet
          setExpandedId((prev) => (prev === null ? list[0].id : prev));
        }
      }
    } catch (err) {
      console.warn('Background sync of FAQs notice:', err.message);
      if (!cachedFaqsList && faqs.length === 0) {
        setFaqError(err.message || 'Unable to load FAQs');
        setIsLoadingFaqs(false);
      }
    }
  };

  const [contactInfo, setContactInfo] = useState(() => cachedContactInfo || {
    concierge: {
      section_badge: 'CLIENT SERVICES',
      section_title: 'ATELIER CONCIERGE',
      email: 'concierge@houseofurvaah.com',
      phone: '+91 22 4900 8800',
      hours: 'Monday – Saturday: 10:00 AM – 8:00 PM IST'
    },
    boutiques: {
      section_badge: 'FLAGSHIP BOUTIQUES',
      section_title: 'ATELIER LOCATIONS',
      locations: [
        {
          id: 1,
          name: 'MUMBAI FLAGSHIP & STYLING SALON',
          address: 'Kala Ghoda Arts District, Colaba Causeway, Mumbai 400001',
          phone: '+91 22 4900 8800',
          is_active: true
        },
        {
          id: 2,
          name: 'NEW DELHI CONCIERGE & SHOWROOM',
          address: 'Mehrauli Heritage District, Style Mile, New Delhi 110030',
          phone: '+91 11 4800 7700',
          is_active: true
        }
      ]
    }
  });

  const fetchContactInfo = async () => {
    try {
      const res = await apiClient('/api/ui/contact-info');
      if (res && res.success && res.data) {
        cachedContactInfo = res.data;
        setContactInfo(res.data);
      }
    } catch (err) {
      console.warn('Could not fetch dynamic contact details:', err.message);
    }
  };

  useEffect(() => {
    fetchFAQs();
    fetchContactInfo();
  }, []);

  const validateIndianMobile = (value) => {
    const clean = (value || '').replace(/\D/g, '');
    let digits = clean;
    if (clean.length === 12 && clean.startsWith('91')) digits = clean.slice(2);
    if (clean.length === 11 && clean.startsWith('0')) digits = clean.slice(1);

    if (!digits) {
      return { isValid: false, error: 'Mobile number is required.' };
    }
    if (!/^[6-9]/.test(digits)) {
      return { isValid: false, error: 'Mobile number must start with 6, 7, 8, or 9.' };
    }
    if (digits.length < 10) {
      return { isValid: false, error: `Please enter a complete 10-digit mobile number (${digits.length}/10 digits).` };
    }
    if (digits.length > 10) {
      return { isValid: false, error: 'Mobile number cannot exceed 10 digits.' };
    }
    if (/^(\d)\1{9}$/.test(digits)) {
      return { isValid: false, error: 'Please enter a valid, non-repetitive mobile number.' };
    }
    return { isValid: true, error: '', clean: digits };
  };

  const handlePhoneChange = (e) => {
    let raw = e.target.value.replace(/\D/g, '');
    if (raw.length === 12 && raw.startsWith('91')) raw = raw.slice(2);
    if (raw.length === 11 && raw.startsWith('0')) raw = raw.slice(1);
    raw = raw.slice(0, 10);

    setFormData((prev) => ({ ...prev, phone: raw }));

    if (phoneTouched || raw.length > 0) {
      const res = validateIndianMobile(raw);
      setPhoneError(res.isValid ? '' : res.error);
    } else {
      setPhoneError('');
    }
  };

  const handlePhoneBlur = () => {
    setPhoneTouched(true);
    const res = validateIndianMobile(formData.phone);
    setPhoneError(res.isValid ? '' : res.error);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPhoneTouched(true);

    const phoneValidation = validateIndianMobile(formData.phone);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.error);
      const phoneInputEl = document.getElementById('contact-phone-input');
      phoneInputEl?.focus();
      return;
    }

    if (!formData.name || !formData.email || !formData.message) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      await apiClient('/api/contact/submit', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject,
          message: formData.message,
        }),
      });

      setIsSubmitted(true);
      setPhoneError('');
      setPhoneTouched(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: 'Order Inquiry',
        message: '',
      });
      setTimeout(() => {
        setIsSubmitted(false);
      }, 5000);
    } catch (err) {
      console.error('Contact submission error:', err);
      setSubmitError(err.message || 'Failed to submit enquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Accordion Item
  const toggleAccordion = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Trigger Urvaah Bot modal
  const handleOpenBot = () => {
    window.dispatchEvent(new CustomEvent('open-urvaah-bot'));
  };

  // Filter FAQs based on active category & search query
  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory =
      activeCategory === 'All' || faq.category === activeCategory;

    const matchesSearch =
      !faqSearch.trim() ||
      faq.question?.toLowerCase().includes(faqSearch.toLowerCase()) ||
      faq.answer?.toLowerCase().includes(faqSearch.toLowerCase()) ||
      faq.category?.toLowerCase().includes(faqSearch.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full max-w-full min-h-screen bg-white text-[#111111] font-serif pt-24 pb-8 md:pt-32 md:pb-10 overflow-x-hidden select-none">
      <SEOHead
        title="Contact Us & FAQs | House of Urvaah — Concierge & Client Support"
        description="Connect with House of Urvaah customer care and atelier concierge. Browse frequently asked questions regarding sizing, deliveries, and returns."
        keywords="House of Urvaah contact, customer care, FAQs, fashion concierge, order inquiries, bespoke sizing"
      />

      {/* 1. HERO HEADER SECTION */}
      <section className="w-full max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 mb-14 md:mb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center flex flex-col items-center"
        >
          <span className="text-[10px] sm:text-xs font-serif tracking-[0.3em] uppercase text-neutral-500 font-semibold mb-3 block">
            CLIENT SERVICES & ATELIER CARE
          </span>
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-normal tracking-wider uppercase text-[#111111] mb-6">
            CONTACT HOUSE OF URVAAH
          </h1>

          <div className="w-16 h-[1px] bg-neutral-900/30 mb-6" />

          <p className="max-w-2xl text-base sm:text-lg md:text-xl font-serif leading-relaxed text-neutral-700 tracking-wide font-light text-center">
            Our Atelier Concierge is available to assist you with bespoke styling, order inquiries, boutique appointments, and press relations.
          </p>
        </motion.div>
      </section>

      {/* 2. TWO-COLUMN CONTACT SECTION */}
      <section id="direct-enquiry" className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16 mb-[70px] md:mb-[102px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Minimalist Luxury Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 bg-[#FAF8F3] p-8 sm:p-10 md:p-12 border border-neutral-200/80 rounded-xs shadow-sm"
          >
            <span className="text-[10px] sm:text-xs font-serif tracking-[0.3em] uppercase text-neutral-800 font-semibold mb-2 block">
              DIRECT ENQUIRY
            </span>
            <h2 className="section-heading font-serif tracking-[0.1em] text-brand-dark mb-8">
              SEND A MESSAGE
            </h2>

            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 flex flex-col items-center text-center space-y-4"
              >
                <CheckCircle2 className="w-12 h-12 text-emerald-800 stroke-[1.5]" />
                <h3 className="text-xl font-serif tracking-widest uppercase text-neutral-900 font-semibold">
                  ENQUIRY RECEIVED
                </h3>
                <p className="text-xs sm:text-sm font-serif text-neutral-800 max-w-md font-normal">
                  Thank you for reaching out to House of Urvaah.
                  Our Atelier Concierge will respond to your enquiry within 24 hours.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 font-serif">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-xs tracking-[0.2em] uppercase text-neutral-900 font-semibold block">
                      FULL NAME *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Eleanor Vance"
                      className="w-full bg-white border border-neutral-300 px-4 py-3 text-xs text-neutral-900 placeholder:text-neutral-400 font-medium focus:outline-none focus:border-black transition-colors"
                    />
                  </div>

                  {/* Email Address */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-xs tracking-[0.2em] uppercase text-neutral-900 font-semibold block">
                      EMAIL ADDRESS *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="eleanor@example.com"
                      className="w-full bg-white border border-neutral-300 px-4 py-3 text-xs text-neutral-900 placeholder:text-neutral-400 font-medium focus:outline-none focus:border-black transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Phone Number with Full Validations */}
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs tracking-[0.2em] uppercase text-neutral-900 font-semibold block">
                        PHONE NUMBER *
                      </label>
                      {formData.phone && (
                        <span className={`text-[10px] font-sans font-medium ${
                          formData.phone.length === 10 && !phoneError ? 'text-emerald-700' : 'text-neutral-600'
                        }`}>
                          {formData.phone.length}/10 digits
                        </span>
                      )}
                    </div>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-xs font-semibold text-neutral-600 select-none pointer-events-none">
                        +91
                      </span>
                      <input
                        id="contact-phone-input"
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone.length > 5 ? `${formData.phone.slice(0, 5)} ${formData.phone.slice(5, 10)}` : formData.phone}
                        onChange={handlePhoneChange}
                        onBlur={handlePhoneBlur}
                        maxLength={11}
                        placeholder="98765 43210"
                        className={`w-full bg-white border ${
                          phoneError
                            ? 'border-rose-500 focus:border-rose-600'
                            : formData.phone.length === 10 && !phoneError
                            ? 'border-emerald-600 focus:border-emerald-600'
                            : 'border-neutral-300 focus:border-black'
                        } pl-11 pr-9 py-3 text-xs text-neutral-900 placeholder:text-neutral-400 font-medium focus:outline-none transition-colors tabular-nums`}
                      />
                      {formData.phone.length === 10 && !phoneError && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3 pointer-events-none" />
                      )}
                      {phoneError && (
                        <AlertCircle className="w-4 h-4 text-rose-500 absolute right-3 pointer-events-none" />
                      )}
                    </div>
                    {phoneError && (
                      <p className="text-[11px] text-rose-600 font-sans tracking-wide mt-1 flex items-center gap-1 font-medium">
                        {phoneError}
                      </p>
                    )}
                  </div>

                  {/* Topic / Subject */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-xs tracking-[0.2em] uppercase text-neutral-900 font-semibold block">
                      ENQUIRY SUBJECT
                    </label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full bg-white border border-neutral-300 px-4 py-3 text-xs text-neutral-900 font-medium focus:outline-none focus:border-black transition-colors"
                    >
                      <option value="Order Inquiry">Order & Delivery Inquiry</option>
                      <option value="Private Concierge">Private Concierge & Styling</option>
                      <option value="Boutique Appointment">Boutique Appointment</option>
                      <option value="Press & Media">Press, PR & Wholesale</option>
                    </select>
                  </div>
                </div>

                {/* Message */}
                <div className="flex flex-col space-y-2">
                  <label className="text-xs tracking-[0.2em] uppercase text-neutral-900 font-semibold block">
                    YOUR MESSAGE *
                  </label>
                  <textarea
                    name="message"
                    required
                    rows="5"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="How may our Atelier Concierge assist you?"
                    className="w-full bg-white border border-neutral-300 px-4 py-3 text-xs text-neutral-900 placeholder:text-neutral-400 font-medium focus:outline-none focus:border-black transition-colors resize-none"
                  />
                </div>

                {/* Error Banner */}
                {submitError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded flex items-center gap-2.5 font-sans">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto bg-[#111111] text-white text-xs font-semibold tracking-[0.25em] uppercase px-8 py-4 hover:bg-neutral-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-3 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>SENDING...</span>
                    </>
                  ) : (
                    <>
                      <span>SEND ENQUIRY</span>
                      <ArrowRight className="w-4 h-4 stroke-[1.5]" />
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>

          {/* Right Column: Atelier Flagships & Contacts */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 flex flex-col space-y-10"
          >
            {/* Atelier Concierge Channels */}
            <div className="bg-neutral-50 p-8 border border-neutral-200/80 rounded-xs space-y-6">
              <span className="text-[10px] sm:text-xs font-serif tracking-[0.3em] uppercase text-neutral-800 font-semibold block">
                {contactInfo.concierge?.section_badge || 'CLIENT SERVICES'}
              </span>
              <h3 className="text-xl font-serif tracking-[0.15em] uppercase text-[#111111]">
                {contactInfo.concierge?.section_title || 'ATELIER CONCIERGE'}
              </h3>

              <div className="space-y-4 text-xs font-serif text-neutral-800 font-normal">
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-neutral-800 mt-0.5 shrink-0 stroke-[1.75]" />
                  <div>
                    <span className="block font-semibold uppercase text-neutral-900 tracking-wider">EMAIL CONCIERGE</span>
                    <a href={`mailto:${contactInfo.concierge?.email || 'concierge@houseofurvaah.com'}`} className="hover:underline text-neutral-800 font-medium block mt-0.5">
                      {contactInfo.concierge?.email || 'concierge@houseofurvaah.com'}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-neutral-800 mt-0.5 shrink-0 stroke-[1.75]" />
                  <div>
                    <span className="block font-semibold uppercase text-neutral-900 tracking-wider">DIRECT HOTLINE</span>
                    <a href={`tel:${(contactInfo.concierge?.phone || '+91 22 4900 8800').replace(/\s+/g, '')}`} className="hover:underline text-neutral-800 font-medium block mt-0.5">
                      {contactInfo.concierge?.phone || '+91 22 4900 8800'}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-neutral-800 mt-0.5 shrink-0 stroke-[1.75]" />
                  <div>
                    <span className="block font-semibold uppercase text-neutral-900 tracking-wider">CONCIERGE HOURS</span>
                    <span className="block text-neutral-800 font-medium mt-0.5">
                      {contactInfo.concierge?.hours || 'Monday – Saturday: 10:00 AM – 8:00 PM IST'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Atelier Flagship Boutiques */}
            <div className="space-y-6">
              <span className="text-[10px] sm:text-xs font-serif tracking-[0.3em] uppercase text-neutral-800 font-semibold block">
                {contactInfo.boutiques?.section_badge || 'FLAGSHIP BOUTIQUES'}
              </span>
              <h3 className="text-xl font-serif tracking-[0.15em] uppercase text-[#111111]">
                {contactInfo.boutiques?.section_title || 'ATELIER LOCATIONS'}
              </h3>

              <div className="space-y-6 text-xs font-serif font-normal text-neutral-800 border-l-2 border-neutral-400 pl-4">
                {(contactInfo.boutiques?.locations || [])
                  .filter((loc) => loc.is_active !== false)
                  .map((loc) => (
                    <div key={loc.id || loc.name}>
                      <h4 className="font-semibold uppercase text-neutral-900 tracking-wider text-sm mb-1">
                        {loc.name}
                      </h4>
                      <p className="leading-relaxed text-neutral-800">
                        {loc.address}
                      </p>
                      {loc.phone && (
                        <span className="text-neutral-700 font-medium block mt-1">{loc.phone}</span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. DYNAMIC FAQS ACCORDION SECTION (Live from Database / Admin Panel) */}
      <section id="faqs" className="w-full max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 scroll-mt-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center flex flex-col items-center mb-6 sm:mb-7"
        >
          <span className="text-[10px] sm:text-xs font-serif tracking-[0.3em] uppercase text-neutral-500 font-semibold mb-3 block flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-neutral-700" />
            CLIENT ASSISTANCE & CONCIERGE
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-normal tracking-wider uppercase text-[#111111] mb-4">
            FREQUENTLY ASKED QUESTIONS
          </h2>
          <div className="w-16 h-[1px] bg-neutral-900/30 mb-4" />
          <p className="max-w-xl text-xs sm:text-sm font-serif leading-relaxed text-neutral-600 font-light text-center">
            Instant answers regarding our collections, sizing, bespoke tailoring, dispatch timelines, and our 7-day return policy.
          </p>
        </motion.div>

        {/* Search & Category Filter Header */}
        <div className="max-w-4xl mx-auto mb-10 space-y-6">
          {/* Search Box */}
          <div className="relative max-w-xl mx-auto">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              placeholder="Search frequently asked questions..."
              className="w-full pl-11 pr-10 py-3 bg-[#FAF8F3] border border-neutral-300 rounded-full text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors"
            />
            {faqSearch && (
              <button
                onClick={() => setFaqSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black p-1"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          {categories.length > 1 && (
            <div className="flex items-center justify-center gap-2 flex-wrap text-xs">
              {categories.map((cat) => {
                const isSelected = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-full font-serif uppercase tracking-wider text-[11px] transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#111111] text-white border-[#111111] font-semibold shadow-xs'
                        : 'bg-[#FAF8F3] text-neutral-700 border-neutral-200/90 hover:bg-neutral-100 hover:text-black'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* FAQ Accordion Body */}
        <div className="max-w-4xl mx-auto">
          {isLoadingFaqs ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-neutral-400">
              <Loader2 className="w-7 h-7 animate-spin text-neutral-800" />
              <p className="text-xs uppercase tracking-widest font-serif">Retrieving FAQs...</p>
            </div>
          ) : faqError ? (
            <div className="py-12 px-6 text-center bg-[#FAF8F3] border border-neutral-200 rounded-lg">
              <p className="text-xs text-neutral-700 mb-3">{faqError}</p>
              <button
                onClick={fetchFAQs}
                className="px-4 py-2 bg-[#111111] text-white text-xs font-serif uppercase tracking-wider rounded-none hover:bg-neutral-800"
              >
                Retry
              </button>
            </div>
          ) : filteredFaqs.length === 0 ? (
            <div className="py-16 text-center bg-[#FAF8F3] border border-neutral-200 rounded-lg p-8">
              <HelpCircle className="w-8 h-8 text-neutral-400 mx-auto mb-3" />
              <h3 className="text-sm font-serif uppercase tracking-wider text-neutral-900 font-semibold mb-1">
                No matching questions found
              </h3>
              <p className="text-xs text-neutral-600 mb-4 max-w-sm mx-auto">
                {faqSearch
                  ? `No FAQs matched "${faqSearch}". Try searching for another keyword or view all categories.`
                  : 'There are currently no published questions in this category.'}
              </p>
              {faqSearch && (
                <button
                  onClick={() => setFaqSearch('')}
                  className="px-4 py-2 bg-[#111111] text-white text-xs uppercase tracking-wider hover:bg-neutral-800"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-neutral-200 border-t border-b border-neutral-200">
              {filteredFaqs.map((faq, index) => {
                const isOpen = expandedId === faq.id;
                return (
                  <motion.div
                    key={faq.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                    className="group"
                  >
                    <button
                      onClick={() => toggleAccordion(faq.id)}
                      className="w-full py-5 sm:py-6 flex items-start justify-between gap-4 text-left cursor-pointer transition-colors hover:text-black focus:outline-none"
                      aria-expanded={isOpen}
                    >
                      <div className="space-y-1.5 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-serif uppercase tracking-widest text-neutral-500 font-semibold">
                            {faq.category || 'General'}
                          </span>
                        </div>
                        <h3 className="text-sm sm:text-base font-serif font-medium text-neutral-950 tracking-wide leading-snug no-underline group-hover:text-neutral-800 transition-colors">
                          {faq.question}
                        </h3>
                      </div>
                      <div
                        className={`p-1.5 rounded-full border border-neutral-200 shrink-0 mt-0.5 transition-transform duration-300 ${
                          isOpen ? 'bg-[#111111] text-white rotate-180 border-[#111111]' : 'bg-[#FAF8F3] text-neutral-600 group-hover:border-neutral-400'
                        }`}
                      >
                        <ChevronDown className="w-3.5 h-3.5 stroke-[2]" />
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="pb-6 pt-1 text-xs sm:text-sm font-serif font-light text-neutral-700 leading-relaxed pr-6 sm:pr-12">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. CONCIERGE HELP CALLOUT (Urvaah Bot & Direct Enquiry CTA) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto mt-16 bg-[#FAF8F3] border border-neutral-300/80 rounded-xs p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left"
        >
          <div className="space-y-2">
            <span className="text-[10px] sm:text-xs font-serif tracking-[0.25em] uppercase text-neutral-500 font-semibold block">
              CANNOT FIND YOUR ANSWER?
            </span>
            <h3 className="text-lg sm:text-xl font-serif uppercase tracking-wider text-neutral-900 font-normal">
              OUR ATELIER CONCIERGE IS AT YOUR SERVICE
            </h3>
            <p className="text-xs font-serif text-neutral-600 max-w-lg font-light">
              Chat in real time with our AI fashion stylist <strong className="font-semibold text-neutral-900">Urvaah Bot</strong>, or dispatch a direct inquiry to our styling salon.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
            <button
              onClick={handleOpenBot}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#111111] text-white text-xs font-serif uppercase tracking-[0.2em] font-semibold hover:bg-neutral-800 transition-all cursor-pointer"
            >
              <WomanAiIcon className="w-4 h-4 text-emerald-400" />
              <span>ASK URVAAH BOT</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('direct-enquiry');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-neutral-300 text-neutral-900 text-xs font-serif uppercase tracking-[0.2em] font-semibold hover:bg-neutral-100 transition-all cursor-pointer"
            >
              <span>SEND MESSAGE</span>
            </button>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default ContactUs;
