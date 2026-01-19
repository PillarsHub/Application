import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Get } from "../hooks/useFetch";
import { GetToken } from "../features/authentication/hooks/useToken.jsx";

//To set the environment to a con
const _environmentId_override = null;

export default function useTheme({ subdomain } = {}) {
  const [environmentId] = useState(_environmentId_override);
  const [loading, setLoading] = useState(false);
  const [error] = useState(false);
  const [theme, setTheme] = useState({ init: true });

  useEffect(() => {
    setTheme(() => {
      // Check local storage for the theme first
      const storedTheme = GetThemeFromLocalStorage(GetToken()?.environmentId);
      if (storedTheme) {
        return storedTheme;
      } else {
        setLoading(true);
        return undefined;
      }
    })
  }, [subdomain]);

  useEffect(() => {
    if (theme == undefined) {
      let path = '/api/v1/Theme';
      if (subdomain) { path += "/" + subdomain; }
      if (environmentId) path = `/api/v1/Theme?environmentId=${environmentId}`;

      Get(path, (data) => {
        setLoading(false);
        SetThemeInLocalStorage(data, GetToken()?.environmentId);
        setTheme(data);
      }, () => {
        setLoading(false);
        setTheme({});
      })
    }
  }, [theme]);

  return { theme, loading, error };
}

function ClearTheme() {
  for (const key in localStorage) {
    if (key.startsWith('theme_')) {
      localStorage.removeItem(key);
    }
  }
}

function GetThemeFromLocalStorage(key) {
  const tokenString = localStorage.getItem('theme_' + key);
  const theme = JSON.parse(tokenString)

  let expire = new Date(theme?.expire);
  if (isNaN(expire) == false && expire <= new Date()) {
    return null;
  }

  return theme;
}

function SetThemeInLocalStorage(theme, key) {
  var d = new Date();
  d.setMinutes(d.getMinutes() + 1);

  const themeString = JSON.stringify({ ...theme, expire: d });
  localStorage.setItem('theme_' + key, themeString);
}

export { useTheme, ClearTheme };

useTheme.propTypes = {
  subdomain: PropTypes.string
}