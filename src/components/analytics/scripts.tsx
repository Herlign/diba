import Script from "next/script"

export function AnalyticsScripts({ gtmId, pixelId }: { gtmId?: string; pixelId?: string }) {
  if (!gtmId && !pixelId) return null
  return (
    <>
      {gtmId ? (
        <Script id="gtm" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];window.dataLayer.push({'gtm.start':Date.now(),event:'gtm.js'});`}
        </Script>
      ) : null}
      {gtmId ? <Script src={`https://www.googletagmanager.com/gtm.js?id=${gtmId}`} strategy="afterInteractive" /> : null}
      {pixelId ? (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`}
        </Script>
      ) : null}
    </>
  )
}
