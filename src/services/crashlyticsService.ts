/**
 * Crashlytics & Error Reporting Service for Sonance Music Player
 * Captures uncaught client errors, logs breadcrumbs, and reports stack traces
 * to Firebase and the developer console.
 */
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface CrashBreadcrumb {
  timestamp: string;
  message: string;
  category?: 'audio' | 'ui' | 'navigation' | 'settings' | 'general';
  data?: Record<string, any>;
}

export interface CrashReport {
  id?: string;
  message: string;
  stack?: string;
  name?: string;
  timestamp: string;
  userAgent: string;
  url: string;
  appVersion: string;
  breadcrumbs: CrashBreadcrumb[];
  metadata?: Record<string, any>;
}

// In-memory ring buffer of recent actions/breadcrumbs
const MAX_BREADCRUMBS = 20;
const breadcrumbsBuffer: CrashBreadcrumb[] = [];

/**
 * Record a breadcrumb indicating a user action or system state change
 */
export function recordBreadcrumb(
  message: string,
  category: CrashBreadcrumb['category'] = 'general',
  data?: Record<string, any>
): void {
  try {
    const breadcrumb: CrashBreadcrumb = {
      timestamp: new Date().toISOString(),
      message,
      category,
      data,
    };
    breadcrumbsBuffer.push(breadcrumb);
    if (breadcrumbsBuffer.length > MAX_BREADCRUMBS) {
      breadcrumbsBuffer.shift();
    }
  } catch {
    // Breadcrumbs must never throw
  }
}

/**
 * Report an exception to Firebase Firestore crash_reports and log to console
 */
export async function recordException(
  error: Error | unknown,
  contextMessage?: string,
  metadata?: Record<string, any>
): Promise<void> {
  const errObj = error instanceof Error ? error : new Error(String(error));
  console.error(`[Crashlytics] ${contextMessage ? contextMessage + ': ' : ''}`, errObj);

  try {
    const report: CrashReport = {
      message: errObj.message || 'Unknown error occurred',
      stack: errObj.stack,
      name: errObj.name || 'Error',
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
      appVersion: '1.0.2',
      breadcrumbs: [...breadcrumbsBuffer],
      metadata: {
        ...metadata,
        contextMessage,
      },
    };

    // Safely write to Firestore crash_reports collection (non-blocking)
    if (db) {
      const reportsCol = collection(db, 'crash_reports');
      await addDoc(reportsCol, report);
    }
  } catch (logErr) {
    // Avoid recursive error logging
    console.warn('[Crashlytics] Could not sync crash to Firestore:', logErr);
  }
}

/**
 * Initialize automatic global error and rejection listeners
 */
let isInitialized = false;

export function initializeCrashlytics(): void {
  if (isInitialized || typeof window === 'undefined') return;
  isInitialized = true;

  recordBreadcrumb('Sonance application launched', 'ui');

  // Catch unhandled JavaScript exceptions
  window.addEventListener('error', (event: ErrorEvent) => {
    recordException(
      event.error || new Error(event.message || 'Uncaught error event'),
      'Uncaught Window Error',
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      }
    );
  });

  // Catch unhandled Promise rejections
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    recordException(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      'Unhandled Promise Rejection'
    );
  });
}
