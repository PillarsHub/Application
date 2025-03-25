import React, { useState, useEffect, useRef } from "react";
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';

const generateUUID = () => {
  try {
    return crypto.randomUUID().replace(/-/g, '_');
  } catch (e) {
    return uuidv4().replace(/-/g, '_');
  }
};

const HtmlFrame = ({ htmlContent, cssContent, data }) => {
  const iframeRef = useRef(null);
  const [frameId] = useState(() => 'frame_' + generateUUID());
  const [iframeHeight, setIframeHeight] = useState("150px"); // Default height

  const fullHtml = `
    <html>
      <head>
        <meta charset="UTF-8" />
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
                background-color: var(--tblr-card-bg);
                overflow-y: scroll; /* allow scroll if needed */
                scrollbar-width: none; /* for Firefox */
            }
        </style>
      </head>
      <script>
        document.addEventListener('DOMContentLoaded', () => {
          const links = document.querySelectorAll('a[target="_blank"]');
          links.forEach(link => {
            let rel = (link.getAttribute('rel') || '').split(/\\s+/);
            if (!rel.includes('noopener')) rel.push('noopener');
            if (!rel.includes('noreferrer')) rel.push('noreferrer');
            link.setAttribute('rel', rel.join(' '));
          });

          if (typeof onIframeReady === 'function') {
            onIframeReady();
          }
          window.requestInjectedObject();
        });
      </script>
      <script>
      (function () {
          let lastHeight = 150;
          let debounceTimer = null;

          function checkHeight() {
              clearTimeout(debounceTimer);
              
              debounceTimer = setTimeout(() => {
                  const finalHeight = document.body.scrollHeight;
                  if (finalHeight != lastHeight) {
                      console.log('A-${frameId}' + lastHeight + ' - ' + finalHeight);
                      lastHeight = finalHeight;
                      window.parent.postMessage({ type: 'resizeIframe', height: lastHeight, frameId: '${frameId}' }, '*');
                      setInterval(checkHeight, 500);
                  }
              }, 200);
          }

          window.addEventListener('load', checkHeight);
          window.addEventListener('resize', checkHeight);

          // Step 1: Define global function in iframe
          window.requestInjectedObject = function () {
            window.parent.postMessage({ type: 'requestJavaObject', frameId: '${frameId}' }, '*');
          };

          // Step 2: Listen for the parent's response
          window.addEventListener('message', function (event) {
            if (event.data && event.data.type === 'initJavaObject' && event.data.incomingFrameId === '${frameId}') {
              window.myInjectedObject = event.data.payload;

              if (typeof onDataReady === 'function') {
                onDataReady(window.myInjectedObject);
              }
            }
          });
        })();
      </script>
      <body>${htmlContent}</body>
    </html>`;

  useEffect(() => {
    const handleMessage = (event) => {
      const { type, frameId: incomingFrameId } = event.data || {};
  
      // Iframe asks for the object
      if (type === 'requestJavaObject' && incomingFrameId === frameId) {
        iframeRef.current?.contentWindow?.postMessage({
          type: 'initJavaObject',
          incomingFrameId: frameId,
          payload: data
        }, '*');
      }
  
      // Iframe resizes
      if (type === 'resizeIframe' && incomingFrameId === frameId) {
        console.log("B-" + incomingFrameId + ' - ' + event.data.height);
        setIframeHeight(`${event.data.height}px`);
      }
    };
  
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return <>
    {htmlContent && <iframe
      ref={iframeRef}
      srcDoc={fullHtml}
      sandbox="allow-popups allow-modals allow-scripts allow-popups-to-escape-sandbox"
      style={{
        width: "100%",
        height: iframeHeight,
        border: "none"
      }}
    />}
  </>
};

export default HtmlFrame;

HtmlFrame.propTypes = {
  htmlContent: PropTypes.string.isRequired,
  cssContent: PropTypes.string.isRequired,
  data: PropTypes.any.isRequired
}