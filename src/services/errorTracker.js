/**
 * Error Tracker Service for House of Urvaah
 * Catches UI crashes, functional runtime errors, unhandled promise rejections,
 * and console.error invocations, forwarding them to the database for admin monitoring.
 */

const API_BASE_URL = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '');

let isInitialized = false;
let isReporting = false; // Prevents recursive loops if error reporting itself triggers an error
const reportedCache = new Map();
const DEDUP_WINDOW_MS = 5000; // 5 second deduplication window for identical errors

/**
 * Safely get logged-in user information if present
 */
function getActiveUser() {
  try {
    const rawCustomer = localStorage.getItem('urvaah_user');
    const rawAdmin = localStorage.getItem('urvaah_admin_user');
    const raw = rawAdmin || rawCustomer;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      id: parsed.id || parsed.userId || parsed.adminid || null,
      email: parsed.email || parsed.username || null,
      role: parsed.role || null
    };
  } catch (_) {
    return null;
  }
}

/**
 * Detect client browser & operating system
 */
function getClientEnvironment() {
  if (typeof window === 'undefined') return {};
  const ua = navigator.userAgent || '';
  
  let browser = 'Unknown';
  let os = 'Unknown';
  let deviceType = 'Desktop';

  if (/mobile/i.test(ua)) deviceType = 'Mobile';
  else if (/tablet|ipad/i.test(ua)) deviceType = 'Tablet';

  if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  if (/edg\//i.test(ua)) browser = 'Edge';
  else if (/chrome|crios/i.test(ua)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua)) browser = 'Safari';
  else if (/opera|opr\//i.test(ua)) browser = 'Opera';

  return { browser, os, deviceType, screenWidth: window.innerWidth, screenHeight: window.innerHeight };
}

/**
 * Core send report function
 */
export async function sendErrorReport({
  errorMessage,
  errorName = 'Error',
  errorStack = '',
  errorType = 'ui', // 'ui', 'functional', 'console', 'unhandled_rejection', 'network'
  severity = 'error', // 'error', 'warn', 'fatal', 'info'
  url = '',
  componentStack = ''
}) {
  if (typeof window === 'undefined') return;
  if (!errorMessage || typeof errorMessage !== 'string') return;

  // Filter out noisy third-party or browser-extension errors
  const lowerMsg = errorMessage.toLowerCase();
  if (
    lowerMsg.includes('resizeobserver loop') ||
    lowerMsg.includes('chrome-extension://') ||
    lowerMsg.includes('moz-extension://') ||
    lowerMsg.includes('safari-extension://')
  ) {
    return;
  }

  // Deduplicate identical errors occurring repeatedly in rapid succession
  const currentUrl = url || window.location.href;
  const dedupKey = `${errorName}:${errorMessage.slice(0, 100)}:${currentUrl}`;
  const now = Date.now();
  const lastTime = reportedCache.get(dedupKey);

  if (lastTime && now - lastTime < DEDUP_WINDOW_MS) {
    return;
  }
  reportedCache.set(dedupKey, now);

  // Clean old deduplication entries to avoid memory growth
  if (reportedCache.size > 200) {
    for (const [key, timestamp] of reportedCache.entries()) {
      if (now - timestamp > DEDUP_WINDOW_MS) {
        reportedCache.delete(key);
      }
    }
  }

  if (isReporting) return;
  isReporting = true;

  try {
    const user = getActiveUser();
    const env = getClientEnvironment();

    const payload = {
      errorMessage,
      errorName,
      errorStack: errorStack || (new Error().stack || ''),
      errorType,
      severity,
      url: currentUrl,
      componentStack,
      userId: user?.id || null,
      userEmail: user?.email || null,
      browser: env.browser,
      os: env.os,
      deviceType: env.deviceType
    };

    // Use fetch with keepalive so unloads still deliver report
    await fetch(`${API_BASE_URL}/api/error-logs/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    });
  } catch (err) {
    // Silently fail if reporting server is unreachable - do not crash client
  } finally {
    isReporting = false;
  }
}

/**
 * Initialize global error listeners:
 * 1. window.onerror
 * 2. window.onunhandledrejection
 * 3. console.error interceptor
 */
export function initErrorTracker() {
  if (isInitialized || typeof window === 'undefined') return;
  isInitialized = true;

  // 1. Uncaught global runtime errors
  window.addEventListener('error', (event) => {
    try {
      const error = event.error || {};
      const message = event.message || error.message || 'Unknown runtime script error';
      sendErrorReport({
        errorMessage: message,
        errorName: error.name || 'ScriptError',
        errorStack: error.stack || (event.filename ? `${event.filename}:${event.lineno}:${event.colno}` : ''),
        errorType: 'functional',
        severity: 'error',
        url: window.location.href
      });
    } catch (_) {}
  });

  // 2. Unhandled Promise Rejections (e.g. failed async/await, API rejects)
  window.addEventListener('unhandledrejection', (event) => {
    try {
      const reason = event.reason;
      let message = 'Unhandled Promise Rejection';
      let stack = '';
      let name = 'UnhandledPromiseRejection';

      if (reason instanceof Error) {
        message = reason.message || message;
        stack = reason.stack || '';
        name = reason.name || name;
      } else if (typeof reason === 'string') {
        message = reason;
      } else if (reason && typeof reason === 'object') {
        try {
          message = JSON.stringify(reason);
        } catch (_) {
          message = String(reason);
        }
      }

      sendErrorReport({
        errorMessage: message,
        errorName: name,
        errorStack: stack,
        errorType: 'unhandled_rejection',
        severity: 'error',
        url: window.location.href
      });
    } catch (_) {}
  });

  // 3. Intercept console.error calls
  const originalConsoleError = console.error;
  console.error = function (...args) {
    // Still output to browser console natively for developer convenience
    originalConsoleError.apply(console, args);

    try {
      if (isReporting) return;

      // Extract message and stack from args
      let message = '';
      let stack = '';
      let name = 'ConsoleError';

      const firstArg = args[0];
      if (firstArg instanceof Error) {
        message = firstArg.message;
        stack = firstArg.stack || '';
        name = firstArg.name || name;
      } else {
        message = args.map((arg) => {
          if (arg instanceof Error) return arg.message;
          if (typeof arg === 'object') {
            try { return JSON.stringify(arg); } catch (_) { return String(arg); }
          }
          return String(arg);
        }).join(' ');
      }

      // Avoid capturing reports sent to our own error-logs endpoint
      if (message.includes('/api/error-logs/report')) return;

      if (message && message.trim().length > 0) {
        sendErrorReport({
          errorMessage: message,
          errorName: name,
          errorStack: stack || (new Error().stack || ''),
          errorType: 'console',
          severity: 'error',
          url: window.location.href
        });
      }
    } catch (_) {}
  };
}

/**
 * Custom report trigger (can be invoked directly from anywhere in the app)
 */
export function reportCustomError(err, context = {}) {
  const message = err instanceof Error ? err.message : String(err || 'Custom Reported Error');
  const stack = err instanceof Error ? err.stack : (context.stack || '');
  const name = err instanceof Error ? err.name : (context.name || 'CustomError');

  return sendErrorReport({
    errorMessage: message,
    errorName: name,
    errorStack: stack,
    errorType: context.errorType || 'functional',
    severity: context.severity || 'error',
    url: context.url || window.location.href,
    componentStack: context.componentStack || ''
  });
}
