<script lang="ts">
  import { TolgeeProvider } from '@tolgee/svelte';
  import UI from '@tolgee/ui';
  import type { TolgeeConfig } from '@tolgee/core';

  const tolgeeConfig = {
    preloadFallback: true,
    apiUrl: import.meta.env.VITE_TOLGEE_API_URL,
    apiKey: import.meta.env.VITE_TOLGEE_API_KEY,
    ui: import.meta.env.VITE_TOLGEE_API_KEY ? UI : undefined,
    staticData: {
      en: () => import('../i18n/en.json').then((m) => m.default),
      de: () => import('../i18n/de.json').then((m) => m.default),
      cs: () => import('../i18n/cs.json').then((m) => m.default),
      fr: () => import('../i18n/fr.json').then((m) => m.default)
    },
    availableLanguages: ['en', 'de', 'cs', 'fr']
  } as TolgeeConfig;
</script>

<TolgeeProvider config={tolgeeConfig}>
  <div slot="loading-fallback">Loading...</div>
  <slot />
</TolgeeProvider>
