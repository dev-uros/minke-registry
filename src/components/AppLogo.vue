<template>
  <svg
      width="1600"
      height="200"
      viewBox="0 0 1600 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
  >
    <!-- emblem -->
    <g transform="translate(40, -5)">
      <path
          d="M0 112 L88 0 L176 112 L88 224 L0 112 Z"
          fill="var(--ui-primary)"
      />
      <path
          d="M44 112 L88 28 L132 112 L88 196 L44 112 Z"
          fill="#35495E"
          opacity="0.95"
      />
    </g>

    <!-- wordmark -->
    <text
        x="250"
        y="150"
        font-family="Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
        font-weight="700"
        font-size="160"
        fill="currentColor"
        style="dominant-baseline:alphabetic;"
    >
      MinkeRegistry
    </text>

    <!-- underline -->
    <rect
        x="250"
        y="165"
        width="1000"
        height="10"
        rx="5"
        fill="var(--ui-primary)"
    />
  </svg>
</template>

<script setup lang="ts"></script>
