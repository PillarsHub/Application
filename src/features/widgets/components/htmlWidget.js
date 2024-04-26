import React, { useState, useEffect } from "react";
import PropTypes from 'prop-types';
import parse from 'html-react-parser';
import Mustache from 'mustache';
import { SendRequest } from '../../../hooks/usePost';

const HtmlWidget = ({ html, customer, widget }) => {
  var [data, setData] = useState({});
  var [output, setOutput] = useState();

  useEffect(() => {
    if (html) {
      let pane = widget.panes ? widget.panes[0] : {};

      //if ((pane.title?.trim() ?? '') != '') {
        if (pane.imageUrl?.toLowerCase() == "api") {
          var url = Mustache.render(pane.title, { customer: customer, data: data });
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
          var ttt = { query: pane.title, variables: { customerId: customer.id } };
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
      //} else {
      //  setData({});
      //}

      try {
        var renderedHTML = Mustache.render(html, { customer: customer, data: data });
        setOutput(renderedHTML);
      } catch {
        //Nothing
      }
    }
  }, [html, data])

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

  return renderedOutput;
}

export default HtmlWidget;

HtmlWidget.propTypes = {
  html: PropTypes.string.isRequired,
  customer: PropTypes.object.isRequired,
  widget: PropTypes.object.isRequired
}