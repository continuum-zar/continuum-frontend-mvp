/*
 * Decorative fonts (Sarina via @fontsource, Satoshi via Fontshare CDN) used on
 * marketing, onboarding, and dashboard-placeholder flows. Imported dynamically
 * from main.tsx at idle-time so they never sit on the critical render path.
 *
 * Both faces use `font-display: swap`, so the fallback stack paints first and
 * the real glyphs swap in when the network returns.
 */
import "@fontsource/sarina";
import "./fonts-satoshi.css";
