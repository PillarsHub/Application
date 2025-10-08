import React, {useState, useEffect } from 'react';
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

  const getQueryParam = (name) => {
    const queryString = window.location.search.substring(1);
    const queryParams = queryString.split('&');

    for (let i = 0; i < queryParams.length; i++) {
      const pair = queryParams[i].split('=');
      if (pair[0] === name) {
        return pair[1];
      }
    }

    return null;
  };

  useEffect(() => {

    const ssoToken = getQueryParam('token');
    if (ssoToken) {
      Get(`/Authentication/refresh/${ssoToken}`, (response) => {
        response.SSO = true;
        saveToken(response);
      }, () => {
        clearToken();
        return null;
      })
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
    token
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

function GetScope() {
  const userToken = GetUser();
  return userToken?.scope;
}

export { GetToken, GetUser, GetScope };
