import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Order Inquiry',
    message: '',
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: 'Order Inquiry',
        message: '',
      });
    }, 4000);
  };

  return (
    <div className="w-full max-w-full min-h-screen bg-white text-[#111111] font-serif pt-24 pb-20 md:pt-32 md:pb-28 overflow-x-hidden select-none">
      {/* 1. HERO HEADER SECTION */}
      <section className="w-full max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 mb-14 md:mb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center flex flex-col items-center"
        >
          {/* Page Title Heading */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-normal tracking-wider uppercase text-[#111111] mb-6">
            CONTACT HOUSE OF URVAAH
          </h1>

          {/* Divider Line */}
          <div className="w-16 h-[1px] bg-neutral-900/30 mb-6" />

          {/* Subtitle / Tagline */}
          <p className="max-w-2xl text-base sm:text-lg md:text-xl font-serif leading-relaxed text-neutral-700 tracking-wide font-light text-center">
            Our Atelier Concierge is available to assist you with bespoke styling, order inquiries, boutique appointments, and press relations.
          </p>
        </motion.div>
      </section>

      {/* 2. TWO-COLUMN CONTACT SECTION */}
      <section className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16 mb-20 md:mb-28">
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
                  Thank you for reaching out to{' '}
                  <span
                    className="font-script lowercase text-[1.1em] mx-1"
                    style={{ fontFamily: "'Parfumerie Script', cursive" }}
                  >
                    house of
                  </span>{' '}
                  <span className="font-serif uppercase tracking-widest font-semibold">URVAAH</span>.
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
                  {/* Phone Number */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-xs tracking-[0.2em] uppercase text-neutral-900 font-semibold block">
                      PHONE NUMBER
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className="w-full bg-white border border-neutral-300 px-4 py-3 text-xs text-neutral-900 placeholder:text-neutral-400 font-medium focus:outline-none focus:border-black transition-colors"
                    />
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

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-[#111111] text-white text-xs font-semibold tracking-[0.25em] uppercase px-8 py-4 hover:bg-neutral-800 transition-colors flex items-center justify-center gap-3 cursor-pointer"
                >
                  SEND ENQUIRY <ArrowRight className="w-4 h-4 stroke-[1.5]" />
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
                CLIENT SERVICES
              </span>
              <h3 className="text-xl font-serif tracking-[0.15em] uppercase text-[#111111]">
                ATELIER CONCIERGE
              </h3>

              <div className="space-y-4 text-xs font-serif text-neutral-800 font-normal">
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-neutral-800 mt-0.5 shrink-0 stroke-[1.75]" />
                  <div>
                    <span className="block font-semibold uppercase text-neutral-900 tracking-wider">EMAIL CONCIERGE</span>
                    <a href="mailto:concierge@houseofurvaah.com" className="hover:underline text-neutral-800 font-medium block mt-0.5">
                      concierge@houseofurvaah.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-neutral-800 mt-0.5 shrink-0 stroke-[1.75]" />
                  <div>
                    <span className="block font-semibold uppercase text-neutral-900 tracking-wider">DIRECT HOTLINE</span>
                    <a href="tel:+912249008800" className="hover:underline text-neutral-800 font-medium block mt-0.5">
                      +91 22 4900 8800
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-neutral-800 mt-0.5 shrink-0 stroke-[1.75]" />
                  <div>
                    <span className="block font-semibold uppercase text-neutral-900 tracking-wider">CONCIERGE HOURS</span>
                    <span className="block text-neutral-800 font-medium mt-0.5">
                      Monday – Saturday: 10:00 AM – 8:00 PM IST
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Atelier Flagship Boutiques */}
            <div className="space-y-6">
              <span className="text-[10px] sm:text-xs font-serif tracking-[0.3em] uppercase text-neutral-800 font-semibold block">
                FLAGSHIP BOUTIQUES
              </span>
              <h3 className="text-xl font-serif tracking-[0.15em] uppercase text-[#111111]">
                ATELIER LOCATIONS
              </h3>

              <div className="space-y-6 text-xs font-serif font-normal text-neutral-800 border-l-2 border-neutral-400 pl-4">
                {/* Mumbai */}
                <div>
                  <h4 className="font-semibold uppercase text-neutral-900 tracking-wider text-sm mb-1">
                    MUMBAI FLAGSHIP & STYLING SALON
                  </h4>
                  <p className="leading-relaxed text-neutral-800">
                    Kala Ghoda Arts District, Colaba Causeway, Mumbai 400001
                  </p>
                  <span className="text-neutral-700 font-medium block mt-1">+91 22 4900 8800</span>
                </div>

                {/* New Delhi */}
                <div>
                  <h4 className="font-semibold uppercase text-neutral-900 tracking-wider text-sm mb-1">
                    NEW DELHI CONCIERGE & SHOWROOM
                  </h4>
                  <p className="leading-relaxed text-neutral-800">
                    Mehrauli Heritage District, Style Mile, New Delhi 110030
                  </p>
                  <span className="text-neutral-700 font-medium block mt-1">+91 11 4800 7700</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. PRIVATE BOUTIQUE STYLING BANNER */}
      <section className="w-full bg-[#FAF6EE] py-14 md:py-20 border-y border-neutral-200/80 overflow-hidden">
        <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-8 flex flex-col space-y-3 text-left">
              <span className="text-[10px] sm:text-xs font-serif tracking-[0.3em] uppercase text-neutral-500">
                PRIVATE CONSULTATION
              </span>
              <h3 className="text-2xl sm:text-3xl font-serif font-normal tracking-[0.18em] uppercase text-[#111111]">
                BESPOKE BOUTIQUE STYLING APPOINTMENTS
              </h3>
              <p className="text-xs sm:text-sm font-serif text-neutral-600 max-w-2xl font-light leading-relaxed">
                Experience private 1-on-1 wardrobe consultations with our senior atelier stylists in Mumbai or New Delhi. Select your pieces prior to arrival for a tailored luxury session.
              </p>
            </div>

            <div className="lg:col-span-4 flex items-center lg:justify-end">
              <Link
                to="/#best-sellers"
                className="bg-[#111111] text-white text-xs font-semibold tracking-[0.25em] uppercase px-8 py-4 hover:bg-neutral-800 transition-colors inline-flex items-center gap-3"
              >
                BOOK APPOINTMENT <ArrowRight className="w-4 h-4 stroke-[1.5]" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactUs;
