import { Component } from "react";

// Catches render errors anywhere below it in the tree (fetch/API errors are
// handled separately in hooks - error boundaries only see thrown render
// errors, not rejected promises). Class component because React has no hook
// equivalent for getDerivedStateFromError/componentDidCatch.
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled render error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-fallback">
          <p>Something went wrong. Please refresh the page.</p>
        </div>
      );
    }

    return this.props.children;
  }
}
