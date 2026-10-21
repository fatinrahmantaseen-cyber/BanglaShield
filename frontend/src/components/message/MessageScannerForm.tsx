'use client';

import React, { useState } from 'react';
import { MessageSquareWarning, Loader2, Sparkles, Shield, AlertCircle } from 'lucide-react';

interface MessageScannerFormProps {
  onAnalyze: (message: string) => Promise<void>;
  isLoading: boolean;
  serverError?: string | null;
  onClearServerError?: () => void;
}

export function MessageScannerForm({
  onAnalyze,
  isLoading,
  serverError,
  onClearServerError,
}: MessageScannerFormProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const presets = [
    {
      label: 'Bangla Lottery Lure',
      language: 'বাংলা',
      message: 'অভিনন্দন! আপনি ৫০,০০০ টাকা লটারি জিতেছেন। প্রসেসিং ফি বাবদ ১,০০০ টাকা পাঠান।',
      note: 'Advance-fee prize scam in Bangla script',
    },
    {
      label: 'Bangla Threat & OTP Demand',
      language: 'বাংলা',
      message: 'বিকাশ হেল্পডেস্ক: আপনার অ্যাকাউন্ট স্থগিত করা হয়েছে। অবিলম্বে চালু করতে পিন ও ওটিপি দিন।',
      note: 'Urgent threat + credential harvesting',
    },
    {
      label: 'Banglish Urgent Link Phish',
      language: 'Banglish',
      message: 'Apnar bkash account 24 ghontar moddhe bondho hobe. Verify korte ei link e click korun: http://bkash-verify.xyz ebong otp din.',
      note: 'Banglish transliteration + phishing link',
    },
    {
      label: 'English Prize Scam',
      language: 'English',
      message: 'Congratulations! You have won $10,000 cash prize. Please send $50 processing fee to claim your prize.',
      note: 'Advance-fee 419 lottery lure',
    },
    {
      label: 'Legitimate Receipt (Safe)',
      language: 'English',
      message: 'You have received Tk 1,500.00 from 01712345678. Fee Tk 0.00. Balance Tk 2,350.00. TrxID 9H7B6K2.',
      note: 'Standard genuine mobile banking receipt',
    },
    {
      label: 'Legitimate OTP Notice (Safe)',
      language: 'English',
      message: 'Your Nagad OTP is 492019. Do not share this OTP with anyone. Valid for 2 mins.',
      note: 'Authentic authentication code with defensive warning',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    if (onClearServerError) onClearServerError();

    const trimmed = inputMessage.trim();

    if (!trimmed) {
      setValidationError('Please enter a message or paste SMS text to evaluate.');
      return;
    }

    if (trimmed.length > 4096) {
      setValidationError('Message exceeds the maximum limit of 4096 characters.');
      return;
    }

    try {
      await onAnalyze(trimmed);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setValidationError(err.message);
      } else {
        setValidationError('An unexpected error occurred while analyzing the message.');
      }
    }
  };

  const handleSelectPreset = (text: string) => {
    setInputMessage(text);
    setValidationError(null);
    if (onClearServerError) onClearServerError();
  };

  const activeError = validationError || serverError;

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-5 sm:p-6 backdrop-blur-sm">
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center gap-2 text-cyan-400 font-semibold text-base sm:text-lg">
          <MessageSquareWarning className="h-5 w-5" aria-hidden="true" />
          <h2>Inspect SMS & Scam Messages</h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-400">
          Evaluates suspicious text messages in Bangla, Banglish, English, or mixed languages against common social-engineering vectors.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        <div>
          <label htmlFor="message-input" className="sr-only">
            Message text to evaluate
          </label>
          <div className="relative">
            <textarea
              id="message-input"
              rows={4}
              value={inputMessage}
              onChange={(e) => {
                setInputMessage(e.target.value);
                if (validationError) setValidationError(null);
                if (onClearServerError) onClearServerError();
              }}
              placeholder="Paste suspicious SMS, WhatsApp notice, or reward claim here... (Bangla script, Banglish, or English supported)"
              disabled={isLoading}
              className={`w-full rounded-lg border bg-slate-950/80 p-4 text-sm text-slate-100 placeholder-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-y min-h-[110px] ${
                activeError
                  ? 'border-rose-500/60 focus:border-rose-500'
                  : 'border-slate-800 focus:border-cyan-500/50'
              } disabled:opacity-60`}
              aria-invalid={activeError ? 'true' : 'false'}
              aria-describedby={activeError ? 'message-error' : undefined}
            />
            {inputMessage && !isLoading && (
              <button
                type="button"
                onClick={() => {
                  setInputMessage('');
                  setValidationError(null);
                  if (onClearServerError) onClearServerError();
                }}
                className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-200"
                aria-label="Clear message"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1 px-1">
            <span>Supports Bangla, Banglish transliteration, and English</span>
            <span>{inputMessage.length} / 4096</span>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-500/30 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Evaluating Message...</span>
              </>
            ) : (
              <>
                <Shield className="h-4 w-4" aria-hidden="true" />
                <span>Analyze Message</span>
              </>
            )}
          </button>
        </div>

        {activeError && (
          <div
            id="message-error"
            role="alert"
            className="flex items-start gap-2.5 text-xs text-rose-300 bg-rose-950/40 border border-rose-500/40 rounded-lg p-3"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" aria-hidden="true" />
            <span className="leading-relaxed">{activeError}</span>
          </div>
        )}
      </form>

      {/* Preset demo buttons */}
      <div className="mt-4 pt-3 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
          <span>Quick test presets:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPreset(preset.message)}
              disabled={isLoading}
              className="rounded-md border border-slate-800 bg-slate-950/60 px-2.5 py-1 text-xs text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-500 text-left disabled:opacity-50"
              title={preset.note}
            >
              <span className="text-[10px] font-mono text-cyan-400 mr-1.5">[{preset.language}]</span>
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 text-[11px] text-slate-400">
        🛡️ <strong>Local Privacy Assured:</strong> BanglaShield inspects message text using the local FastAPI server. Content is never sent to third-party services or written to log files.
      </div>
    </div>
  );
}

