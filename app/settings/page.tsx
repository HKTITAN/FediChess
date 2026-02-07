"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { exportAccount, importAccount, type AccountExportFile } from "@/lib/account-backup";
import { useUserStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  const router = useRouter();
  const hydrateFromStorage = useUserStore((s) => s.hydrateFromStorage);

  const [exportPassword, setExportPassword] = React.useState("");
  const [exportConfirm, setExportConfirm] = React.useState("");
  const [exportError, setExportError] = React.useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = React.useState(false);

  const [importFile, setImportFile] = React.useState<File | null>(null);
  const [importPassword, setImportPassword] = React.useState("");
  const [importError, setImportError] = React.useState<string | null>(null);
  const [importing, setImporting] = React.useState(false);

  const handleExport = React.useCallback(async () => {
    setExportError(null);
    setExportSuccess(false);
    if (!exportPassword || exportPassword.length === 0) {
      setExportError("Please enter a password.");
      return;
    }
    if (exportPassword !== exportConfirm) {
      setExportError("Passwords do not match.");
      return;
    }
    try {
      const file = await exportAccount(exportPassword);
      const blob = new Blob([JSON.stringify(file, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fedichess-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportSuccess(true);
      setExportPassword("");
      setExportConfirm("");
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "Export failed.");
    }
  }, [exportPassword, exportConfirm]);

  const handleImport = React.useCallback(async () => {
    setImportError(null);
    if (!importFile || !importPassword) {
      setImportError("Please select a backup file and enter its password.");
      return;
    }
    setImporting(true);
    try {
      const text = await importFile.text();
      const file = JSON.parse(text) as AccountExportFile;
      const result = await importAccount(file, importPassword);
      if (result.ok) {
        await hydrateFromStorage();
        router.push("/lobby");
        return;
      }
      setImportError(result.error);
    } catch {
      setImportError("Invalid file or corrupted backup.");
    } finally {
      setImporting(false);
    }
  }, [importFile, importPassword, hydrateFromStorage, router]);

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">Home</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/lobby">Lobby</Link>
          </Button>
        </div>

        <h1 className="font-instrument text-2xl font-bold">Account backup</h1>
        <p className="text-sm text-muted-foreground">
          Export your progress (ELO, game history, name) to a file and restore it on another device. The backup is signed so it cannot be edited for fair play. Remember the password you set; you will need it to import.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Export account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label htmlFor="export-password" className="mb-1 block text-sm font-medium">
                Password
              </label>
              <Input
                id="export-password"
                type="password"
                placeholder="Choose a password"
                value={exportPassword}
                onChange={(e) => setExportPassword(e.target.value)}
                className="min-h-[44px]"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label htmlFor="export-confirm" className="mb-1 block text-sm font-medium">
                Confirm password
              </label>
              <Input
                id="export-confirm"
                type="password"
                placeholder="Confirm password"
                value={exportConfirm}
                onChange={(e) => setExportConfirm(e.target.value)}
                className="min-h-[44px]"
                autoComplete="new-password"
              />
            </div>
            {exportError && (
              <p className="text-sm text-destructive" role="alert">
                {exportError}
              </p>
            )}
            {exportSuccess && (
              <p className="text-sm text-green-600 dark:text-green-400" role="status">
                Backup downloaded. Store the file and password safely.
              </p>
            )}
            <Button onClick={handleExport} className="min-h-[44px] min-w-[44px]">
              Export account
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Import account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label htmlFor="import-file" className="mb-1 block text-sm font-medium">
                Backup file
              </label>
              <Input
                id="import-file"
                type="file"
                accept=".json,application/json"
                onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                className="min-h-[44px]"
              />
            </div>
            <div>
              <label htmlFor="import-password" className="mb-1 block text-sm font-medium">
                Password
              </label>
              <Input
                id="import-password"
                type="password"
                placeholder="Password used when exporting"
                value={importPassword}
                onChange={(e) => setImportPassword(e.target.value)}
                className="min-h-[44px]"
                autoComplete="current-password"
              />
            </div>
            {importError && (
              <p className="text-sm text-destructive" role="alert">
                {importError}
              </p>
            )}
            <Button
              onClick={handleImport}
              disabled={importing || !importFile || !importPassword}
              className="min-h-[44px] min-w-[44px]"
            >
              {importing ? "Importing…" : "Import account"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
