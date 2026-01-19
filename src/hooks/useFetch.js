import { useState, useEffect } from 'react';
import { GetToken } from '../features/authentication/hooks/useToken.jsx';
import BaseUrl from './baseUrl';

function useFetch(url, params, notFoundResult = null) {
  const [variables, setVariables] = useState(params);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    get_private(params);
  }, [url])

  function refetch(prms) {
    const combined = { ...variables, ...prms };
    const filteredCombined = Object.fromEntries(
      Object.entries(combined).filter(([, value]) => value !== null)
    );

    get_private(filteredCombined);
  }

  function get_private(prms) {
    if (url) {
      const objString = prms ? '?' + Object.entries(prms).map(([key, value]) => {
        if (Array.isArray(value)) {
          // If the value is an array, repeat the parameter for each element
          return value.map((element) => `${key}=${encodeURIComponent(element)}`).join('&');
        } else {
          // If the value is not an array, just include the parameter once
          return `${key}=${encodeURIComponent(value)}`;
        }
      }).join('&') : '';

      setLoading(true);
      Get(url + objString, (r) => {
        setLoading(false);
        setVariables(prms);
        setError(null);
        setData(r);
      }, (error, code) => {
        setLoading(false);
        if (code == 404 && notFoundResult != null) {
          setVariables(prms);
          setError(null);
          setData(notFoundResult);
        } else {
          setError({ code: code, message: error });
        }
      });
    } else {
      setLoading(false);
      setData();
    }
  }

  return { data, loading, error, variables, refetch: refetch }
}

function Get(url, onSuccess, onError) {
  let xhr = new XMLHttpRequest();
  let fullUrl = BaseUrl + url;
  if (url.startsWith("https")) fullUrl = url;

  // open a connection
  xhr.open("GET", fullUrl, true);

  // Set the request header i.e. which type of content you are sending
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.setRequestHeader("Authorization", GetToken()?.token);

  // Create a state change callback
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status >= 200 && xhr.status <= 205) {
        try {
          onSuccess(JSON.parse(xhr.response));
        }
        catch (e) {
          onError(e);
        }
      }
      else {
        onError(xhr.response, xhr.status);
      }
    }
  };

  // Sending data with the request
  xhr.send();
}

export { useFetch, Get };