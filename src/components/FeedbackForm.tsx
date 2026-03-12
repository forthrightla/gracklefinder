"use client";

import { useState } from "react";

interface FeedbackFormProps {
  slug: string;
}

export default function FeedbackForm({ slug }: FeedbackFormProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, message: message.trim() }),
      });
      if (!res.ok) throw new Error();
      setStatus("sent");
      setMessage("");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-xl bg-[#1a1a1a] p-4 text-center">
        <p className="text-sm text-green-400">
          Thanks, we&apos;ll look into it!
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-gray-500 hover:text-[#9b5de5] transition-colors"
      >
        Report Outdated Info
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-[#1a1a1a] p-4">
      <label className="text-sm text-gray-400 block mb-2">
        What&apos;s outdated or incorrect?
      </label>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        className="w-full bg-white/10 text-sm text-[#e8e8e8] placeholder-gray-500 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#9b5de5]/50 resize-none"
        placeholder="e.g. They no longer have wifi..."
      />
      <div className="flex gap-2 mt-2">
        <button
          type="submit"
          disabled={status === "sending" || !message.trim()}
          className="text-sm px-4 py-1.5 rounded-lg bg-[#9b5de5] text-white hover:bg-[#8a4dd4] transition-colors disabled:opacity-50"
        >
          {status === "sending" ? "Sending..." : "Submit"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm px-4 py-1.5 rounded-lg bg-white/10 text-gray-400 hover:bg-white/15 transition-colors"
        >
          Cancel
        </button>
      </div>
      {status === "error" && (
        <p className="text-xs text-red-400 mt-2">
          Failed to send. Please try again.
        </p>
      )}
    </form>
  );
}
