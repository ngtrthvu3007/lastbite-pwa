<template>
  <div class="flex items-center gap-2 text-brand">
    <svg width="36" height="36" viewBox="0 0 512 512" role="img" aria-label="LastBite" class="shrink-0">
      <defs>
        <linearGradient id="lb-logo-body" x1="96" y1="128" x2="416" y2="443" gradientUnits="userSpaceOnUse">
          <stop stop-color="#3B9146" />
          <stop offset="1" stop-color="#1B5E20" />
        </linearGradient>
        <linearGradient id="lb-logo-leaf" x1="255" y1="204" x2="346" y2="296" gradientUnits="userSpaceOnUse">
          <stop stop-color="#F7B23B" />
          <stop offset="1" stop-color="#EE8A2B" />
        </linearGradient>
        <mask id="lb-logo-bite">
          <rect width="512" height="512" fill="#fff" />
          <circle cx="405" cy="126" r="30" fill="#000" />
          <circle cx="425" cy="158" r="30" fill="#000" />
          <circle cx="441" cy="190" r="30" fill="#000" />
        </mask>
      </defs>
      <g mask="url(#lb-logo-bite)">
        <path fill="url(#lb-logo-body)"
          d="M105 155c8-17 25-27 44-27h214c19 0 36 10 44 27l50 107c5 11 7 23 4 35l-26 100c-7 27-31 46-59 46H136c-28 0-52-19-59-46L51 297c-3-12-1-24 4-35l50-107Z" />
        <path fill="url(#lb-logo-body)"
          d="M66 269h380c18 0 32 14 32 32v7c0 18-14 32-32 32H66c-18 0-32-14-32-32v-7c0-18 14-32 32-32Z" />
      </g>
      <path fill="#fff"
        d="M60 290c0-8 6-14 14-14h126c11 0 21 5 28 14l8 10 8-10c7-9 17-14 28-14h166c8 0 14 6 14 14s-6 14-14 14H272c-3 0-6 2-8 5l-17 21c-6 8-18 8-24 0l-17-21c-2-3-5-5-8-5H74c-8 0-14-6-14-14Z" />
      <path fill="url(#lb-logo-leaf)" d="M255 296c2-52 39-88 91-92 4 52-30 89-91 92Z" />
      <path fill="#fff" d="M263 285c20-22 42-39 67-53-19 17-35 36-49 58l-18-5Z" />
    </svg>
    <span class="text-2xl font-extrabold">Lastbite</span>
  </div>
</template>
