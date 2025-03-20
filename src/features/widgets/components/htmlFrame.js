import React from "react";
import PropTypes from 'prop-types';
import parse from 'html-react-parser';

const HtmlFrame = ({ htmlContent }) => {
  let renderedOutput = null;

  try {
    // Attempt to parse and render output
    renderedOutput = <>{parse(htmlContent ?? '')}</>;
  } catch (error) {
    // Handle parsing or rendering error
    console.error('Error parsing or rendering output:', error);
    // Provide a fallback or error message
    renderedOutput = <p>Error parsing or rendering output</p>;
  }

  return renderedOutput;
}
export default HtmlFrame;

HtmlFrame.propTypes = {
  htmlContent: PropTypes.string.isRequired
} 


/* import React, { useState, useEffect, useRef } from "react";
import PropTypes from 'prop-types';

const HtmlFrame = ({ htmlContent, script, css }) => {
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
        <style>${css}</style>
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
          
          document.addEventListener("DOMContentLoaded", function () {
            document.body.addEventListener("click", function (event) {
              const target = event.target.closest("a");
              if (target && target.href) {
                event.preventDefault(); // Prevent default behavior
                try {
                  window.top.location.assign(target.href); // Redirect safely
                } catch (error) {
                  console.error("Redirection failed:", error);
                  window.open(target.href, "_top"); // Fallback method
                }
              }
            });
          });
      </script>
      <script>${script}</script>
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
    <iframe
      ref={iframeRef}
      srcDoc={fullHtml}
      sandbox="allow-scripts"
      style={{
        width: "100%",
        height: iframeHeight,
        border: "none",
        transition: "height 0.1s ease-out",
      }}
    />
  </>
};

export default HtmlFrame;

HtmlFrame.propTypes = {
  htmlContent: PropTypes.string.isRequired,
  script: PropTypes.string.isRequired,
  css: PropTypes.string.isRequired
} */