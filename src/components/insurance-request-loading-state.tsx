import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function InsuranceRequestsLoadingState() {
  return (
    <AppShell>
      <div className="mb-6 space-y-3">
        <div className="h-4 w-40 animate-pulse rounded bg-muted" />
        <div className="h-9 w-72 animate-pulse rounded bg-muted" />
        <div className="h-4 max-w-3xl animate-pulse rounded bg-muted" />
      </div>
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <Card key={item}>
            <CardContent className="flex items-center justify-between gap-4 p-5">
              <div className="space-y-3">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="h-8 w-12 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-12 w-12 animate-pulse rounded-lg bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader className="border-b bg-muted/10">
          <div className="h-5 w-48 animate-pulse rounded bg-muted" />
        </CardHeader>
        <CardContent className="space-y-3 p-4">
          {[0, 1, 2].map((item) => (
            <div key={item} className="grid gap-3 rounded-lg border p-4 lg:grid-cols-[auto_1.1fr_1fr_1fr_auto]">
              <div className="h-11 w-11 animate-pulse rounded-lg bg-muted" />
              <div className="space-y-2">
                <div className="h-4 w-36 animate-pulse rounded bg-muted" />
                <div className="h-4 w-28 animate-pulse rounded bg-muted" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-9 w-24 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
