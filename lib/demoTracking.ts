'use client';

export type DemoEventName =
  | 'landing_view'
  | 'demo_cta_click'
  | 'demo_view'
  | 'demo_answer'
  | 'demo_completed'
  | 'signup_cta_click';

type DemoEventMetadata = Record<string, unknown>;

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

function getUtmMetadata() {
  if (typeof window === 'undefined') return {};

  const params = new URLSearchParams(window.location.search);
  const utm = UTM_KEYS.reduce<Record<string, string>>((acc, key) => {
    const value = params.get(key);
    if (value) acc[key] = value.slice(0, 160);
    return acc;
  }, {});

  return Object.keys(utm).length ? { utm } : {};
}

export function trackDemoEvent(eventName: DemoEventName, metadata: DemoEventMetadata = {}) {
  if (typeof window === 'undefined') return;

  try {
    const payload = {
      event_name: eventName,
      path: window.location.pathname,
      referrer: document.referrer || null,
      metadata: {
        ...getUtmMetadata(),
        ...metadata,
      },
    };

    const body = JSON.stringify(payload);

    if (navigator.sendBeacon) {
      const sent = navigator.sendBeacon(
        '/api/demo-events',
        new Blob([body], { type: 'application/json' })
      );

      if (sent) return;
    }

    void fetch('/api/demo-events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Tracking nunca pode atrapalhar a experiência da demo.
  }
}
