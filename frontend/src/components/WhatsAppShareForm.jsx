import React, { useState } from 'react';
import { MessageSquare, ArrowRight, Check, AlertCircle, ChevronDown } from 'lucide-react';
import { validateIndianPhoneNumber, buildWhatsAppShareUrl } from '../utils/whatsapp.js';

export function WhatsAppShareForm({ challengeData }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [hasShared, setHasShared] = useState(false);

  if (!challengeData) return null;

  // Phone Validation
  const validation = validateIndianPhoneNumber(phoneNumber);
  const isInputValid = validation.isValid;
  const showError = hasInteracted && !isInputValid && phoneNumber.trim().length > 0;

  const handlePhoneChange = (e) => {
    setPhoneNumber(e.target.value);
    setHasInteracted(true);
    setHasShared(false);
  };

  const handleShareClick = () => {
    setHasInteracted(true);
    const { url, error } = buildWhatsAppShareUrl(phoneNumber, challengeData);

    if (error || !url) {
      return;
    }

    // Open WhatsApp in a new tab upon explicit user click
    window.open(url, '_blank', 'noopener,noreferrer');
    setHasShared(true);
  };

  return (
    <section
      id="whatsapp-share-section"
      className="w-full mt-4 p-5 sm:p-7 rounded-3xl bg-white border border-[#11151C]/12 shadow-sm relative overflow-hidden"
      aria-labelledby="whatsapp-share-heading"
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        {/* Left: Heading and Subtitle */}
        <div className="max-w-md">
          <h3
            id="whatsapp-share-heading"
            className="text-lg sm:text-xl font-black text-[#111820] tracking-tight"
          >
            Share Your Mission
          </h3>
          <p className="text-xs sm:text-sm text-[#6B6358] font-medium mt-0.5 leading-snug">
            Send this challenge to your team via WhatsApp.
          </p>
        </div>

        {/* Right: Phone input and Green WhatsApp Button */}
        <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 sm:w-72">
            <div className="relative flex items-center rounded-full border-2 border-[#11151C]/15 bg-[#F7F3EA] focus-within:border-[#304DB4] focus-within:ring-2 focus-within:ring-[#304DB4]/20 transition-all overflow-hidden">
              {/* India Country Code Pill */}
              <div className="flex items-center gap-1 pl-3.5 pr-2.5 py-2.5 border-r border-[#11151C]/15 text-xs font-bold text-[#111820] select-none shrink-0 bg-black/5">
                <span>+91</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" aria-hidden="true" />
              </div>

              {/* Number Input */}
              <input
                type="tel"
                id="whatsapp-phone-input"
                name="phoneNumber"
                value={phoneNumber}
                onChange={handlePhoneChange}
                onBlur={() => setHasInteracted(true)}
                placeholder="Enter 10-digit mobile number"
                className="w-full px-3 py-2 bg-transparent text-xs sm:text-sm text-[#111820] font-semibold placeholder-[#8C8477] focus:outline-none"
                aria-label="10-digit Indian mobile number"
                aria-invalid={showError}
                aria-describedby={showError ? 'phone-error-msg' : undefined}
                autoComplete="off"
              />
            </div>

            {/* Error Feedback */}
            {showError && (
              <p
                id="phone-error-msg"
                role="alert"
                className="mt-1.5 text-xs text-[#DC2626] font-semibold flex items-center gap-1.5 pl-2"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{validation.error}</span>
              </p>
            )}

            {/* Success Feedback */}
            {isInputValid && (
              <p className="mt-1.5 text-xs text-[#16A34A] font-semibold flex items-center gap-1.5 pl-2">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>Valid number (+91 {validation.normalizedNumber.slice(2)})</span>
              </p>
            )}
          </div>

          {/* Green WhatsApp Action Button */}
          <button
            type="button"
            id="whatsapp-share-btn"
            onClick={handleShareClick}
            disabled={!isInputValid}
            className={`py-3 px-6 rounded-full font-black text-xs sm:text-sm tracking-wide uppercase flex items-center justify-center gap-2.5 transition-all shadow-md shrink-0 cursor-pointer ${
              isInputValid
                ? 'bg-[#10B981] hover:bg-[#059669] text-white active:scale-95 shadow-[#10B981]/25'
                : 'bg-[#11151C]/15 text-[#111820]/40 cursor-not-allowed shadow-none'
            }`}
            aria-disabled={!isInputValid}
          >
            <MessageSquare className="w-4 h-4 fill-current stroke-none" aria-hidden="true" />
            <span>SHARE VIA WHATSAPP</span>
            <ArrowRight className="w-4 h-4 stroke-[2.8]" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Explanatory note */}
      <div className="mt-3 pt-3 border-t border-[#11151C]/10 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#78716C] gap-2 font-medium">
        <span>WhatsApp will open for you to confirm sending.</span>
        {hasShared && (
          <span className="text-[#059669] font-bold flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Chat initiated in new tab
          </span>
        )}
      </div>
    </section>
  );
}

export default WhatsAppShareForm;
