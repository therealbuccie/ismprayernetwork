import React, { Component, type ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Dashboard caught error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 md:p-8 rounded-2xl border border-destructive/30 bg-destructive/5 backdrop-blur-md text-center max-w-xl mx-auto my-12 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-destructive/15 text-destructive flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              {this.props.fallbackTitle || "Unable to display this section"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              {this.state.error?.message || "An unexpected rendering issue occurred."}
            </p>
          </div>
          <Button
            onClick={this.handleReset}
            size="sm"
            variant="outline"
            className="text-xs gap-1.5 border-border/60"
          >
            <RefreshCw size={12} />
            <span>Try Again</span>
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
