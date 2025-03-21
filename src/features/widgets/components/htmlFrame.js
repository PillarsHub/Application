import React, { useState, useEffect, useRef } from "react";
import PropTypes from 'prop-types';

const HtmlFrame = ({ htmlContent, cssContent }) => {
  const iframeRef = useRef(null);
  const [iframeHeight, setIframeHeight] = useState("150px"); // Default height

  const fullHtml = `
    <html>
      <head>
        <title>Pillars</title>
        <!-- CSS files -->
        <link href="/css/tabler.min.css" rel="stylesheet" asp-append-version="true" />
        <link href="/css/tabler-flags.min.css" rel="stylesheet" asp-append-version="true" />
        <link href="/css/tabler-payments.min.css" rel="stylesheet" asp-append-version="true" />
        <link href="/css/tabler-vendors.min.css" rel="stylesheet" asp-append-version="true" />
        <link href="/css/site.css" rel="stylesheet" asp-append-version="true" />
        <style>${cssContent}</style>
        <style>
            html, body {
                margin: 0;
                padding: 0;
                overflow: hidden;
                background-color: var(--tblr-card-bg);
            }
        </style>
      </head>
      <body>${htmlContent}</body>
      <script>
          function sendHeight() {
              const height = document.body.scrollHeight;
              window.parent.postMessage({ type: 'resizeIframe', height }, '*');
          }
          window.addEventListener('load', sendHeight);
          window.addEventListener('resize', sendHeight);
          setInterval(sendHeight, 500); // Fallback to update height
      </script>
    </html>`;

  useEffect(() => {
    const handleResize = (event) => {
      if (event.data && event.data.type === "resizeIframe") {
        setIframeHeight(`${event.data.height}px`);
      }
    };
    window.addEventListener("message", handleResize);
    return () => window.removeEventListener("message", handleResize);
  }, []);

  return <>
    {htmlContent && <iframe
      ref={iframeRef}
      srcDoc={fullHtml}
      sandbox="allow-scripts"
      style={{
        width: "100%",
        height: iframeHeight,
        border: "none",
        transition: "height 0.1s ease-out",
      }}
    />}
  </>
};

export default HtmlFrame;

HtmlFrame.propTypes = {
  htmlContent: PropTypes.string.isRequired,
  cssContent: PropTypes.string.isRequired
}