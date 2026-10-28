import React, { useState } from 'react';
import { MessageSquare, ArrowRight, Check, AlertCircle, ChevronDown, Copy } from 'lucide-react';
import { validateIndianPhoneNumber, buildWhatsAppShareUrl, formatChallengeForWhatsApp } from '../utils/whatsapp.js';

export function WhatsAppShareForm({ challengeData }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [hasShared, setHasShared] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  const [isOpening, setIsOpening] = useState(false);

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
    if (isOpening || !isInputValid) return;
    setIsOpening(true);
    setHasInteracted(true);
    const { url, error } = buildWhatsAppShareUrl(phoneNumber, challengeData);

    if (error || !url) {
      setIsOpening(false);
      return;
    }

    // Open WhatsApp in a new tab upon explicit user click
    window.open(url, '_blank', 'noopener,noreferrer');
    setHasShared(true);
    setTimeout(() => setIsOpening(false), 800);
  };

  const handleCopyClick = async () => {
    const message = formatChallengeForWhatsApp(challengeData);
    if (!message) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(message);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = message;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    } catch {
      // Fallback silent handle
    }
  };

  return (
    <section
      id="whatsapp-share-section"
      className="w-full p-4 sm:p-4.5 px-6 sm:px-7 rounded-2xl sm:rounded-3xl bg-white border border-[#11151C]/12 shadow-xs relative overflow-hidden"
      aria-labelledby="whatsapp-share-heading"
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4">
        {/* Left: Heading and Subtitle */}
        <div className="max-w-md">
          <h3
            id="whatsapp-share-heading"
            className="text-base sm:text-[17px] font-black text-[#111820] tracking-tight leading-snug"
          >
            Share Your Mission
          </h3>
          <p className="text-xs sm:text-[13px] text-[#6B6358] font-medium mt-0.5 leading-tight">
            Send this challenge to your team via WhatsApp.
          </p>
          {hasShared && (
            <span className="mt-1 text-[#059669] text-xs font-bold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Chat initiated in new tab
            </span>
          )}
        </div>

        {/* Right: Phone input and Green WhatsApp Button */}
        <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
          <div className="flex-1 sm:w-64">
            <div className="relative h-11 sm:h-12 flex items-center rounded-full border border-[#11151C]/18 bg-[#EDE8DF] focus-within:bg-[#F2EDE4] focus-within:border-[#304DB4] focus-within:ring-2 focus-within:ring-[#304DB4]/20 transition-all overflow-hidden shadow-2xs">
              {/* India Country Code Pill - seamlessly integrated without boxy background */}
              <div className="h-full flex items-center gap-1.5 pl-4 pr-2.5 text-xs sm:text-[13px] font-black text-[#111820] select-none shrink-0">
                <span>+91</span>
                <ChevronDown className="w-3.5 h-3.5 stroke-[2.5] text-[#111820]/60" aria-hidden="true" />
              </div>

              {/* Clean vertical divider */}
              <div className="h-5 w-px bg-[#11151C]/15 shrink-0" aria-hidden="true" />

              {/* Number Input with mobile numeric keypad support */}
              <input
                type="tel"
                inputMode="tel"
                pattern="[0-9]*"
                id="whatsapp-phone-input"
                name="phoneNumber"
                value={phoneNumber}
                onChange={handlePhoneChange}
                onBlur={() => setHasInteracted(true)}
                placeholder="Enter 10-digit mobile number"
                className="w-full h-full px-3 bg-transparent text-xs sm:text-sm text-[#111820] font-bold placeholder-[#8C8477] focus:outline-none touch-manipulation"
                aria-label="10-digit Indian mobile number"
                aria-invalid={showError}
                aria-describedby={showError ? 'phone-error-msg' : undefined}
                autoComplete="tel-national"
              />
            </div>

            {/* Error Feedback */}
            {showError && (
              <p
                id="phone-error-msg"
                role="alert"
                className="mt-1 text-[11px] sm:text-xs text-[#DC2626] font-semibold flex items-center gap-1.5 pl-2"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{validation.error}</span>
              </p>
            )}

            {/* Success Feedback */}
            {isInputValid && (
              <p className="mt-1 text-[11px] sm:text-xs text-[#16A34A] font-semibold flex items-center gap-1.5 pl-2">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>Valid number (+91 {validation.normalizedNumber.slice(2)})</span>
              </p>
            )}
          </div>

          {/* Copy Message Button */}
          <button
            type="button"
            id="copy-mission-btn"
            onClick={handleCopyClick}
            className="min-h-[44px] h-11 sm:h-12 px-4 rounded-full font-bold text-xs sm:text-[13px] border border-[#11151C]/15 bg-[#F7F3EA] hover:bg-[#EFE9DD] text-[#111820] flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shrink-0 select-none shadow-2xs"
            title="Copy preformatted mission briefing text"
          >
            {hasCopied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" aria-hidden="true" />
                <span className="text-emerald-700 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#111820]" aria-hidden="true" />
                <span>Copy Text</span>
              </>
            )}
          </button>

          {/* Green WhatsApp Action Button */}
          <button
            type="button"
            id="whatsapp-share-btn"
            onClick={handleShareClick}
            disabled={!isInputValid || isOpening}
            className={`min-h-[44px] h-11 sm:h-12 px-5 sm:px-6 rounded-full font-black text-xs sm:text-[13px] tracking-wide uppercase flex items-center justify-center gap-2.5 transition-all shadow-sm shrink-0 select-none touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981] ${
              isInputValid && !isOpening
                ? 'bg-[#10B981] hover:bg-[#059669] text-white active:scale-95 shadow-[#10B981]/30 cursor-pointer'
                : 'bg-[#10B981] opacity-75 hover:opacity-75 text-white cursor-not-allowed'
            }`}
            aria-disabled={!isInputValid || isOpening}
          >
            <MessageSquare className="w-4 h-4 fill-current stroke-none" aria-hidden="true" />
            <span className="tracking-wider">SHARE VIA WHATSAPP</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[3]" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}

export default WhatsAppShareForm;
