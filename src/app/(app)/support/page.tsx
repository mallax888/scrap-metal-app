"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, Mail, MessageCircle, Phone } from "lucide-react";
import { clsx } from "clsx";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { faqs } from "@/lib/data";

const CHANNELS = [
  {
    icon: MessageCircle,
    title: "Chat with us",
    body: "Weekdays, 8am – 6pm NZT. Usually under 5 minutes.",
    action: "Start a chat",
  },
  {
    icon: Mail,
    title: "Email",
    body: "help@litchi.co.nz — we reply within one business day.",
    action: "Send an email",
  },
  {
    icon: Phone,
    title: "Call",
    body: "0800 LITCHI. Weekdays, 9am – 5pm NZT.",
    action: "See number",
  },
];

const TOPICS = [
  "My bond",
  "A payment",
  "My Litchi agreement",
  "Moving out",
  "Something else",
];

export default function SupportPage() {
  const toast = useToast();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [topic, setTopic] = useState(TOPICS[0]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (message.trim().length < 5) return;
    setSending(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    setSending(false);
    setSent(true);
    setMessage("");
    toast("Message sent — we'll reply within one business day");
  }

  return (
    <>
      <PageHeader
        eyebrow="Support"
        title="We're here."
        subtitle="Real people in New Zealand. If a payment is going to be tight, tell us early — we can move it."
      />

      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {CHANNELS.map((channel) => {
            const Icon = channel.icon;
            return (
              <Card key={channel.title} interactive className="flex flex-col">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream text-bark">
                  <Icon className="h-[18px] w-[18px]" aria-hidden />
                </span>
                <h2 className="mt-4 text-[15px] font-semibold text-ink">{channel.title}</h2>
                <p className="mt-2 mb-5 text-sm leading-relaxed text-mist">{channel.body}</p>
                <div className="mt-auto">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => toast(`${channel.title} isn't connected in this preview`, "info")}
                  >
                    {channel.action}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <Card className="h-full">
              <CardTitle>Common questions</CardTitle>
              <ul className="mt-5 divide-y divide-sand/70">
                {faqs.map((faq, index) => {
                  const open = openFaq === index;
                  return (
                    <li key={faq.q}>
                      <button
                        type="button"
                        onClick={() => setOpenFaq(open ? null : index)}
                        aria-expanded={open}
                        className="flex w-full items-center justify-between gap-4 py-4 text-left"
                      >
                        <span className="text-[15px] font-medium text-ink">{faq.q}</span>
                        <ChevronDown
                          className={clsx(
                            "h-4 w-4 shrink-0 text-clay transition-transform duration-200",
                            open && "rotate-180"
                          )}
                          aria-hidden
                        />
                      </button>
                      {open ? (
                        <p className="-mt-1 pb-4 pr-8 text-sm leading-relaxed text-mist animate-rise">
                          {faq.a}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardTitle>Send us a message</CardTitle>

              {sent ? (
                <div className="mt-6 flex flex-col items-center rounded-tile bg-moss-soft px-6 py-10 text-center animate-pop">
                  <CheckCircle2 className="h-9 w-9 text-moss" aria-hidden />
                  <p className="mt-4 text-sm font-semibold text-ink">Message sent</p>
                  <p className="mt-1.5 max-w-xs text-sm text-mist">
                    We&rsquo;ll reply within one business day, to the email on your account.
                  </p>
                  <Button variant="secondary" size="sm" className="mt-6" onClick={() => setSent(false)}>
                    Send another
                  </Button>
                </div>
              ) : (
                <form onSubmit={send} className="mt-5">
                  <label htmlFor="support-topic" className="text-sm font-medium text-ink">
                    What&rsquo;s it about?
                  </label>
                  <select
                    id="support-topic"
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                    className="mt-2 h-11 w-full rounded-tile border border-sand bg-canvas px-3.5 text-sm text-ink outline-none transition-colors focus:border-clay"
                  >
                    {TOPICS.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>

                  <label htmlFor="support-message" className="mt-5 block text-sm font-medium text-ink">
                    Your message
                  </label>
                  <textarea
                    id="support-message"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    rows={6}
                    placeholder="Tell us what's going on…"
                    className="mt-2 w-full resize-none rounded-tile border border-sand bg-canvas p-3.5 text-sm text-ink outline-none transition-colors placeholder:text-mist focus:border-clay"
                  />

                  <Button
                    type="submit"
                    className="mt-5 w-full"
                    loading={sending}
                    disabled={message.trim().length < 5}
                  >
                    {sending ? "Sending" : "Send message"}
                  </Button>
                  <p className="mt-3 text-xs text-mist">
                    We never ask for your password or full card number over chat or email.
                  </p>
                </form>
              )}
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
