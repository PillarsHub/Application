import React, { useState, useEffect } from "react";
import PropTypes from 'prop-types';
import Mustache from 'mustache';
import { SendRequest } from '../../../hooks/usePost';
import HtmlFrame from "./htmlFrame";
import parse from 'html-react-parser';

const HtmlWidget = ({ html, customer, widget, isPreview }) => {
  var [data, setData] = useState({});
  var [query, setQuery] = useState({});
  var [output, setOutput] = useState('<div>Loading</div>');
  var [authCode, setAuthCode] = useState('');

  useEffect(() => {
    if (widget) {
      let pane = widget.panes ? widget.panes[0] : {};
      if ((pane.title?.trim() ?? '') != '') {
        if (pane.title != query.query) {
          setQuery({ method: pane.imageUrl?.toLowerCase(), query: pane.title });
        }
      }

      var useAuthCode = widget?.settings?.['useAuthorizationCode'];
      if (useAuthCode) {
        if (isPreview) {
          setAuthCode('PREVIEW_ONLY_AUTH_TOKEN_DO_NOT_USE_FOR_REAL_AUTH')
        } else {
          const encodedUsername = encodeURIComponent(customer.emailAddress);
          SendRequest('GET', `/Authentication/GetAuthorizationCode?username=${encodedUsername}`, {}, (data) => {
            setAuthCode(data.token)
          }, () => {
            setAuthCode('');
          });
        }
      }
    }
  }, [widget])

  useEffect(() => {
    if (query && query.query) {
      if (query.method == "api") {
        var url = Mustache.render(query.query, { customer: customer, authorizationCode: authCode, data: data });
        try {
          SendRequest('GET', url, {}, (data) => {
            setData(data)
          }, (error, code) => {
            setData({ error: `${code} - ${error}` });
          });
        } catch (error) {
          setData({ error: `${error}` });
        }
      } else {
        var ttt = { query: query.query, variables: { customerId: customer.id } };
        SendRequest('POST', 'https://api.pillarshub.com/graphql', ttt, (r) => {
          if (r.errors) {
            setData({ error: JSON.stringify(r.errors) });
          } else {
            setData(r.data)
          }
        }, (error, code) => {
          setData({ error: `${code} - ${error}` });
        });
      }
    } else {
      setData({});
    }
  }, [query, customer])

  useEffect(() => {
    if (html) {
      try {
        var renderedHTML = Mustache.render(html, { customer: customer, authorizationCode: authCode, data: data });
        setOutput(renderedHTML);
      } catch {
        //Nothing
      }
    }
  }, [html, data, customer, authCode])

  var useIframe = widget?.settings?.['useIframe'];

  if (useIframe) {
    var clone = { ...customer, widgets: [], cards: [] };
    delete clone.widgets;
    delete clone.cards;
    delete clone.__typename;
    return <HtmlFrame htmlContent={output} cssContent={widget.css} data={{ customer: clone, authorizationCode: authCode, data: data }} />
  } else {
    let renderedOutput = null;

    try {
      // Attempt to parse and render output
      renderedOutput = <>{parse(output ?? '')}</>;
    } catch (error) {
      // Handle parsing or rendering error
      console.error('Error parsing or rendering output:', error);
      // Provide a fallback or error message
      renderedOutput = <p>Error parsing or rendering output</p>;
    }

    return renderedOutput
  }
}

export default HtmlWidget;

HtmlWidget.propTypes = {
  html: PropTypes.string.isRequired,
  customer: PropTypes.object.isRequired,
  widget: PropTypes.object.isRequired,
  isPreview: PropTypes.object.isRequired
}