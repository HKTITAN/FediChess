"use client";

import * as React from "react";
import Link from "next/link";

interface ErrorBoundaryState {
  hasError: boolean;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground">
          <div className="max-w-md text-center space-y-4">
            <h1 className="font-instrument text-xl font-semibold">
              Something went wrong
            </h1>
            <p className="text-sm text-muted-foreground">
              An error occurred. You can go back home or try reloading the page.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground min-h-[44px] min-w-[44px]"
              >
                Go home
              </Link>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium min-h-[44px] min-w-[44px]"
              >
                Reload page
              </button>
            </div>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
