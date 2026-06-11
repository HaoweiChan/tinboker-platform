import { useEffect, useState } from 'react';
import { getTagRegistry } from '@/services/api/podcasts';

/**
 * Shared English→zh-TW tag label registry.
 *
 * The topics index (`/topics`) already translated tags via `/api/tags/registry`,
 * but the episode hero and the single-topic page (`/topics/:tag`) rendered the
 * raw English slug, so the same tag read differently across pages. This hook
 * exposes the registry as a `slug → display_zh` map, fetched ONCE at module
 * scope and shared by every subscriber (each episode card, the hero, the topic
 * pages) so the label is consistent everywhere with a single request.
 */
type Labels = Record<string, string>;

let cache: Labels | null = null;
let inflight: Promise<Labels> | null = null;
const subscribers = new Set<(labels: Labels) => void>();

function load(): Promise<Labels> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = getTagRegistry()
      .then((res) => {
        const labels: Labels = {};
        for (const entry of res.tags) {
          if (entry.slug && entry.display_zh) labels[entry.slug.toLowerCase()] = entry.display_zh;
        }
        cache = labels;
        subscribers.forEach((fn) => fn(labels));
        return labels;
      })
      .catch(() => {
        cache = {};
        return cache;
      });
  }
  return inflight;
}

/** Translate a raw tag/slug to its zh-TW label, mirroring the topics-index logic. */
export function tagLabelFor(tag: string, labels: Labels): string {
  const key = tag.trim().replace(/^#/, '').toLowerCase();
  return labels[key] ?? tag.replace(/^#/, '').replace(/[_-]/g, ' ');
}

/** Subscribe to the shared tag-label registry (slug → zh-TW display). */
export function useTagLabels(): Labels {
  const [labels, setLabels] = useState<Labels>(cache ?? {});
  useEffect(() => {
    if (cache) {
      setLabels(cache);
      return;
    }
    let alive = true;
    const fn = (l: Labels) => {
      if (alive) setLabels(l);
    };
    subscribers.add(fn);
    load();
    return () => {
      alive = false;
      subscribers.delete(fn);
    };
  }, []);
  return labels;
}
