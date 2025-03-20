import React, { useState, useEffect } from "react";
import PropTypes from 'prop-types';
import Mustache from 'mustache';
import { SendRequest } from '../../../hooks/usePost';
import HtmlFrame from "./htmlFrame";

const HtmlWidget = ({ html, customer, widget }) => {
  var [data, setData] = useState({});
  var [query, setQuery] = useState({});
  var [output, setOutput] = useState();

  useEffect(() => {
    if (widget) {
      let pane = widget.panes ? widget.panes[0] : {};
      if ((pane.title?.trim() ?? '') != '') {
        if (pane.title != query.query) {
          setQuery({ method: pane.imageUrl?.toLowerCase(), query: pane.title });
        }
      }
    }
  }, [widget])

  useEffect(() => {
    if (query && query.query) {
      if (query.method == "api") {
        var url = Mustache.render(query.query, { customer: customer, data: data });
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
        var renderedHTML = Mustache.render(html, { customer: customer, data: data });
        setOutput(renderedHTML);
      } catch {
        //Nothing
      }
    }
  }, [html, data, customer])

  return <HtmlFrame htmlContent={output} cssContent={widget.css} scriptCode={``} />
}

export default HtmlWidget;

HtmlWidget.propTypes = {
  html: PropTypes.string.isRequired,
  customer: PropTypes.object.isRequired,
  widget: PropTypes.object.isRequired
}