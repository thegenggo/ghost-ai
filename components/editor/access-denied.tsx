import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

export function AccessDenied() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-surface-border bg-surface">
        <Lock className="h-8 w-8 text-copy-muted" />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-xl font-medium text-copy-primary">
          You don&apos;t have access to this project
        </h1>
        <p className="text-sm text-copy-muted">
          The project may have been removed, or you might not be a collaborator.
        </p>
      </div>
      <Link href="/editor" className={buttonVariants({ variant: "outline" })}>
        <ArrowLeft className="h-4 w-4" />
        Back to editor
      </Link>
    </div>
  );
}
