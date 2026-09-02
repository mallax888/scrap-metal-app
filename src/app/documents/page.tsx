"use client";

import { useMemo, useState } from "react";
import { Download, FileText, FolderOpen, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { documentCategories, documents, type DocumentCategory } from "@/lib/data";
import { formatDateShort } from "@/lib/format";
import { useLitchi } from "@/lib/store";

type Filter = "All" | DocumentCategory;

const CATEGORY_BLURB: Record<DocumentCategory, string> = {
  Tenancy: "Your tenancy agreement and anything your landlord has shared.",
  Bond: "Proof your bond was lodged with Tenancy Services.",
  Litchi: "Your Bond Assist agreement and disclosure documents.",
  Statements: "A statement for every month you've been with Litchi.",
  Insurance: "Contents cover isn't live yet — nothing to show here.",
};

export default function DocumentsPage() {
  const { ready } = useLitchi();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>("All");
  const [downloading, setDownloading] = useState<string | null>(null);

  const filtered = useMemo(
    () => (filter === "All" ? documents : documents.filter((doc) => doc.category === filter)),
    [filter]
  );

  async function download(id: string, name: string) {
    setDownloading(id);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setDownloading(null);
    toast(`${name} downloaded`);
  }

  return (
    <>
      <PageHeader
        eyebrow="Your records"
        title="Documents"
        subtitle="Everything on file for your tenancy and your Litchi agreement."
      />

      <Card>
        <div className="flex flex-wrap gap-2">
          {(["All", ...documentCategories] as Filter[]).map((category) => {
            const count =
              category === "All"
                ? documents.length
                : documents.filter((doc) => doc.category === category).length;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setFilter(category)}
                className={clsx(
                  "flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                  filter === category
                    ? "bg-brand text-onbrand"
                    : "border border-sand bg-paper text-mist hover:bg-cream hover:text-bark"
                )}
              >
                {category}
                <span
                  className={clsx(
                    "numeric rounded-full px-1.5 text-[11px]",
                    filter === category ? "bg-onbrand/20 text-onbrand" : "bg-cream text-clay"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {filter !== "All" && filtered.length > 0 ? (
          <p className="mt-4 text-sm text-mist">{CATEGORY_BLURB[filter]}</p>
        ) : null}

        {!ready ? (
          <div className="mt-6 space-y-3">
            {[0, 1, 2, 3, 4].map((key) => (
              <Skeleton key={key} className="h-14 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            className="mt-6"
            icon={FolderOpen}
            title={`No ${filter.toLowerCase()} documents yet`}
            description={CATEGORY_BLURB[filter as DocumentCategory]}
            action={
              <Button variant="secondary" size="sm" onClick={() => setFilter("All")}>
                Show all documents
              </Button>
            }
          />
        ) : (
          <ul className="mt-6 divide-y divide-sand/70">
            {filtered.map((doc) => (
              <li key={doc.id} className="flex items-center gap-4 py-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cream text-bark">
                  <FileText className="h-[18px] w-[18px]" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{doc.name}</p>
                  <p className="numeric truncate text-xs text-mist">
                    {doc.category} · {formatDateShort(doc.date)} · {doc.size}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => download(doc.id, doc.name)}
                  disabled={downloading === doc.id}
                  aria-label={`Download ${doc.name}`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-sand text-bark transition-colors hover:bg-cream disabled:opacity-50"
                >
                  {downloading === doc.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Download className="h-4 w-4" aria-hidden />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
