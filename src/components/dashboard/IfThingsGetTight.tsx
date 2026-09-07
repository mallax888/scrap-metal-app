"use client";

import { useState } from "react";
import { Ban, HeartHandshake, MessageSquare, RefreshCw } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MovePaymentModal } from "@/components/modals/MovePaymentModal";

/**
 * The standing answer to "what happens if I can't pay this week".
 *
 * Written to be readable before anything has gone wrong, because the moment it
 * has gone wrong is the moment people stop reading. It is also where two CCCFA
 * obligations surface as ordinary product copy rather than fine print: a real
 * hardship route, and a pointer to free financial mentoring — which a lender
 * has to give when someone defaults or applies for hardship.
 */
const PROMISES = [
  {
    icon: Ban,
    title: "No late fees. Ever.",
    body: "Charging someone for being short on money is charging the least able to pay for being least able to pay. The flat 5% on what you borrow is all Litchi charges, and nothing is ever added to it.",
  },
  {
    icon: RefreshCw,
    title: "One retry, not five",
    body: "If a payment fails we try once more, on a day you choose. We never re-present a payment over and over hoping something lands — that just racks up your bank's dishonour fees.",
  },
  {
    icon: MessageSquare,
    title: "A person, not a process",
    body: "If a payment is still outstanding after a week, someone rings you to agree a plan. The call is to sort it out, not to chase you.",
  },
  {
    icon: HeartHandshake,
    title: "Hardship is a right, not a favour",
    body: "If something bigger has changed — illness, losing work, a relationship ending — you can apply for hardship and we have to properly consider it. Ask us and we'll walk you through it.",
  },
];

export function IfThingsGetTight() {
  const [moveOpen, setMoveOpen] = useState(false);

  return (
    <>
      <Card>
        <CardTitle>If a week is going to be tight</CardTitle>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-mist">
          Tell us before the payment is due and we&rsquo;ll move it. It costs nothing, it
          doesn&rsquo;t touch your Litchi Score, and you don&rsquo;t have to explain why.
        </p>

        <div className="mt-6">
          <Button onClick={() => setMoveOpen(true)}>Move a payment</Button>
        </div>

        <dl className="mt-8 grid gap-6 border-t border-sand/70 pt-7 sm:grid-cols-2">
          {PROMISES.map((item) => {
            const Icon = item.icon;
            return (
              // The icon lives inside the <dt>. A <div> inside a <dl> may hold
              // only <dt>/<dd>, so bracketing the pair in a second div to sit
              // beside an icon breaks the link between label and description.
              <div key={item.title}>
                <dt className="flex items-start gap-3 text-[15px] font-semibold text-ink">
                  <span
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cream text-bark"
                    aria-hidden
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 pt-1.5">{item.title}</span>
                </dt>
                <dd className="mt-1.5 pl-11 text-[13px] leading-relaxed text-mist">{item.body}</dd>
              </div>
            );
          })}
        </dl>

        {/*
          Signposting free financial mentoring is a lender obligation when
          someone defaults or asks for hardship, but it reads better as a
          standing offer than as a notice served after things go wrong.
        */}
        <div className="mt-7 rounded-tile bg-cream px-5 py-4">
          <p className="text-[13px] leading-relaxed text-bark">
            <span className="font-semibold text-ink">Free help, independent of us.</span>{" "}
            MoneyTalks offers free, confidential financial mentoring to anyone in New Zealand —
            call 0800 345 123 or text 4029. They don&rsquo;t work for Litchi and they&rsquo;ll
            tell you straight.
          </p>
        </div>
      </Card>

      <MovePaymentModal open={moveOpen} onClose={() => setMoveOpen(false)} />
    </>
  );
}
