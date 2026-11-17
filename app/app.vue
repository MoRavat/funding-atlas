<template>
  <a href="#main" class="skip-link">Skip to content</a>
  <header class="site-header">
    <div class="wrap header-inner">
      <NuxtLink class="brand" to="/">Funding Atlas</NuxtLink>
      <nav aria-label="Main navigation">
        <NuxtLink to="/blog/uk-fintech-funding">Fintech ranking</NuxtLink>
        <NuxtLink to="/generate">Generate a report</NuxtLink>
      </nav>
    </div>
  </header>
  <main id="main">
    <NuxtPage />
  </main>
</template>
