import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// Custom HTML shell: adds the Home-Screen / favicon icons.
// NOTE: icon paths carry the /WodBuilder baseUrl. If the site ever moves off
// GitHub Pages (baseUrl ""), drop the /WodBuilder prefix here.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <ScrollViewStyleReset />
        <link rel="apple-touch-icon" href="/WodBuilder/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="WodBuilder" />
        <link rel="icon" type="image/png" href="/WodBuilder/favicon.png" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body>{children}</body>
    </html>
  );
}
