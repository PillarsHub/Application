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

const HtmlFrame = ({ htmlContent, cssContent, data, onQueryVariablesChange }) => {
  const iframeRef = useRef(null);
  const [frameId] = useState(() => 'frame_' + generateUUID());
  const [iframeHeight, setIframeHeight] = useState("150px"); // Default height
  const [contentVersion, setContentVersion] = useState(0);

  // track latest data for the message handler without re-binding it
  const latestDataRef = useRef(data);
  useEffect(() => { latestDataRef.current = data; }, [data]);

  const isValidData = (d) => {
    if (!d) return false;
    if (Array.isArray(d)) return d.length > 0;
    if (typeof d === 'object') return Object.keys(d).length > 0;
    return true; // numbers/strings/etc
  };

  useEffect(() => {
    setContentVersion(prev => prev + 1);
  }, [htmlContent, cssContent]);

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
          let lastHeight = 0;
          let rafId = null;

          function getContentHeight() {
              const body = document.body;
              const docEl = document.documentElement;
              if (!body || !docEl) return 150;

              return Math.max(
                  body.scrollHeight,
                  body.offsetHeight,
                  body.clientHeight,
                  docEl.scrollHeight,
                  docEl.offsetHeight,
                  docEl.clientHeight,
                  150
              );
          }

          function postHeightIfChanged() {
              const finalHeight = getContentHeight();
              if (finalHeight === lastHeight) return;

              lastHeight = finalHeight;
              window.parent.postMessage({ type: 'resizeIframe', height: lastHeight, frameId: '${frameId}' }, '*');
          }

          function scheduleHeightCheck() {
              if (rafId != null) return;
              rafId = window.requestAnimationFrame(() => {
                  rafId = null;
                  postHeightIfChanged();
              });
          }

          function startObservers() {
              const docEl = document.documentElement;
              const body = document.body;
              if (!docEl || !body) return;

              if (window.ResizeObserver) {
                  const resizeObserver = new ResizeObserver(scheduleHeightCheck);
                  resizeObserver.observe(docEl);
                  resizeObserver.observe(body);
              }

              if (window.MutationObserver) {
                  const mutationObserver = new MutationObserver(scheduleHeightCheck);
                  mutationObserver.observe(docEl, {
                      attributes: true,
                      childList: true,
                      subtree: true,
                      characterData: true
                  });
              }
          }

          window.addEventListener('load', scheduleHeightCheck);
          window.addEventListener('resize', scheduleHeightCheck);
          window.addEventListener('transitionend', scheduleHeightCheck, true);
          window.addEventListener('animationend', scheduleHeightCheck, true);
          document.addEventListener('DOMContentLoaded', () => {
              startObservers();
              scheduleHeightCheck();
          });
          window.setInterval(scheduleHeightCheck, 500);
          if (document.readyState !== 'loading') {
              startObservers();
          }
          scheduleHeightCheck();

          // Step 1: Define global function in iframe
          window.requestInjectedObject = function () {
            window.parent.postMessage({ type: 'requestJavaObject', frameId: '${frameId}' }, '*');
          };

          // Public helper for widget scripts to request GraphQL variable updates in the host.
          window.setQueryParams = function (params, options) {
            const isObject = params && typeof params === 'object' && !Array.isArray(params);
            const safeParams = isObject ? params : {};
            const replace = !!(options && options.replace);

            window.parent.postMessage({
              type: 'updateGraphQLVariables',
              frameId: '${frameId}',
              payload: safeParams,
              replace: replace
            }, '*');
          };

          // Backward-compatible alias.
          window.setWidgetQueryParams = window.setQueryParams;

          // Step 2: Listen for the parent's response
          window.addEventListener('message', function (event) {
            if (event.data && event.data.type === 'initJavaObject' && event.data.incomingFrameId === '${frameId}') {
              window.myInjectedObject = event.data.payload;

              if (typeof onDataReady === 'function' && window.myInjectedObject != null) {
                onDataReady(window.myInjectedObject);
              }
            }
          });
        })();
      </script>
      <body>${htmlContent}</body>
    </html>`;

  // Listener: handle iframe resize + respond when iframe requests data
  useEffect(() => {
    const handleMessage = (event) => {
      // (optional) if you know the iframe origin, enforce it:
      // if (event.origin !== 'https://your-origin.example') return;

      const { type, frameId: incomingFrameId, height } = event.data || {};
      if (incomingFrameId !== frameId) return;

      const isFromCurrentIframe = event.source === iframeRef.current?.contentWindow;

      if (type === 'resizeIframe') {
        if (!isFromCurrentIframe) return;
        setIframeHeight(`${height}px`);
        return;
      }

      if (type === 'requestJavaObject' && isValidData(latestDataRef.current)) {
        iframeRef.current?.contentWindow?.postMessage({
          type: 'initJavaObject',
          incomingFrameId: frameId,
          payload: latestDataRef.current
        }, '*');
        return;
      }

      if (type === 'updateGraphQLVariables' && onQueryVariablesChange) {
        if (!isFromCurrentIframe) return;
        onQueryVariablesChange(event.data.payload, { replace: !!event.data.replace });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [frameId, onQueryVariablesChange]);

  // Proactively send data whenever it becomes valid or changes
  useEffect(() => {
    if (!isValidData(data)) return;

    iframeRef.current?.contentWindow?.postMessage({
      type: 'initJavaObject',
      incomingFrameId: frameId,
      payload: data
    }, '*');
  }, [data, frameId]);

  return (
    <>
      {htmlContent && (
        <iframe
          key={`frame_${frameId}_${contentVersion}`}
          ref={iframeRef}
          srcDoc={fullHtml}
          sandbox="allow-popups allow-modals allow-scripts allow-popups-to-escape-sandbox"
          style={{ width: "100%", height: iframeHeight, border: "none" }}
        />
      )}
    </>
  );
};

export default HtmlFrame;

HtmlFrame.propTypes = {
  htmlContent: PropTypes.string.isRequired,
  cssContent: PropTypes.string.isRequired,
  data: PropTypes.any.isRequired,
  onQueryVariablesChange: PropTypes.func
};
