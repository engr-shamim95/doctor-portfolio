import React from 'react';

/**
 * Root Layout Pass-through
 * Allows Route Groups (payload) and (public) to manage their independent root layouts
 * without clashing HTML/Body hydration hierarchies.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
