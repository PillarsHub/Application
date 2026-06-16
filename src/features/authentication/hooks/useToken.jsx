import React, { useState, useEffect } from 'react';
import { Get } from '../../../hooks/useFetch'

const MINUTE_MS = 60000;
const SESSION_TZ_KEY = "preferredTimeZone";

import { createContext, useContext } from 'react';

const TokenContext = createContext();

export const useToken22 = () => {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error('useToken must be used within a TokenProvider');
  }
  return context;
};

// eslint-disable-next-line react/prop-types
export const TokenProvider = ({ clearToken, children }) => {
  return (
    <TokenContext.Provider value={{ clearToken }}>
      {children}
    </TokenContext.Provider>
  );
};


export default function useToken() {
  const [token, setToken] = useState(GetToken());
  const [initializing, setInitializing] = useState(() => Boolean(getQueryParam('token')));

  useEffect(() => {

    const ssoToken = getQueryParam('token');
    if (ssoToken) {
      Get(`/Authentication/refresh/${encodeURIComponent(ssoToken)}`, (response) => {
        response.SSO = true;
        saveToken(response);
        removeQueryParam('token');
        setInitializing(false);
      }, () => {
        clearToken();
        setInitializing(false);
        return null;
      })
    } else {
      setInitializing(false);
    }

    const interval = setInterval(() => {
      var newToken = GetToken();
      if (!newToken) {
        clearToken();
        return;
      }

      if (newToken?.token != token?.token) {
        setToken(newToken);
      }
    }, MINUTE_MS);

    return () => clearInterval(interval); // This represents the unmount function, in which you need to clear your interval to prevent memory leaks.
  }, [])


  const saveToken = userToken => {
    SaveUser(userToken);
    setToken(userToken?.authToken);

    localStorage.setItem(SESSION_TZ_KEY, userToken.timeZone ?? '');
  };

  const clearToken = () => {
    ClearUser();
    setToken();
  }

  return {
    setToken: saveToken,
    clearToken: clearToken,
    initializing,
    token
  }
}

function getQueryParam(name) {
  const queryString = window.location.search ? window.location.search.substring(1) : '';
  if (!queryString) return null;

  const queryParams = queryString.split('&');
  for (let i = 0; i < queryParams.length; i++) {
    const pair = queryParams[i].split('=');
    if (safeDecodeURIComponent(pair[0] ?? '') === name) {
      return safeDecodeURIComponent((pair.slice(1).join('=') ?? '').replace(/\+/g, ' '));
    }
  }

  return null;
}

function removeQueryParam(name) {
  if (!window.history?.replaceState) return;

  const queryString = window.location.search ? window.location.search.substring(1) : '';
  if (!queryString) return;

  const remaining = queryString
    .split('&')
    .filter((part) => safeDecodeURIComponent((part.split('=')[0] ?? '')) !== name);

  const newSearch = remaining.length ? `?${remaining.join('&')}` : '';
  const newUrl = `${window.location.pathname}${newSearch}${window.location.hash}`;
  try {
    window.history.replaceState(window.history.state, document.title, newUrl);
  } catch {
    // Auth has already been saved; failing to clean the address bar should not break sign-in.
  }
}

function safeDecodeURIComponent(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}


function SaveUser(userToken) {
  var d = new Date();
  d.setMinutes(d.getMinutes() + 25);
  userToken.expire = d;

  localStorage.setItem('token', JSON.stringify(userToken));
}

function ClearUser() {
  localStorage.removeItem('token');
}

function GetUser() {
  const tokenString = localStorage.getItem('token');
  const userToken = JSON.parse(tokenString);

  let expire = new Date(userToken?.expire);
  if (isNaN(expire) == false) {
    var now = new Date();
    if (expire <= now) {
      //if it's a newer token, try a rewnew.
      if (expire >= now.setMinutes(now.getMinutes() - 5)) {
        //Update the expire to another minute to give the refresh time to run.
        SaveUser(userToken);
        console.log("Refresh Token - " + new Date().toString());

        //Update the new token
        Get(`/Authentication/refresh/${userToken.authToken.token}?environmentId=${userToken.authToken.environmentId}`, (response) => {
          response.SSO = userToken?.SSO ?? false;
          SaveUser(response);
        }, () => {
          ClearUser();
        })
      } else {
        ClearUser();
        return null;
      }
    }
  }

  return userToken
}

function GetToken() {
  const userToken = GetUser();
  return userToken?.authToken
}

function GetSettings() {
  const userToken = GetUser();
  return userToken?.environmentSettings
}

function GetScope() {
  const userToken = GetUser();
  return userToken?.scope;
}

function CanRead(accessType) {
  var av = GetToken().access[accessType]?.toLowerCase();
  return av == 'fullaccess' || av == 'readonly';
}

function CanWrite(accessType) {
  var av = GetToken().access[accessType]?.toLowerCase();
  return av == 'fullaccess' || av == 'writeonly';
}


const AccessTypes = {
  GraphQL: "graphQL",
  Customers: "customers",
  Batches: "batches",
  Bonuses: "bonuses",
  CompensationPlans: "compensationPlans",
  Nodes: "nodes",
  Periods: "periods",
  Placements: "placements",
  Snapshots: "snapshots",
  SourceGroups: "sourceGroups",
  Sources: "sources",
  Trees: "trees",
  Values: "values",
  Autoships: "autoships",
  Inventory: "inventory",
  Orders: "orders",
  Users: "users"
}

export { GetToken, GetUser, GetScope, GetSettings, CanRead, CanWrite, AccessTypes };
