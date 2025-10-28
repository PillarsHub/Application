import { useState, useEffect } from 'react';
import { useQuery, gql } from "@apollo/client";
import { GetToken } from "../features/authentication/hooks/useToken";
import { Post } from '../hooks/usePost';

var GET_CUSTOMER_MENU = gql`query ($customerId: String!) {
  customers(customerId: {eq: $customerId}) {
    fullName
    profileImage
  }
  menus (customerId: $customerId){
    id
    name
    type
    items{
      icon
      status
      title
      url
    }
  }
}`;

var GET_CUSTOMER_MENU_PLAIN = `query ($customerId: String!) {
  customers(customerId: {eq: $customerId}) {
    fullName
    profileImage
  }
  menus (customerId: $customerId){
    id
    name
    type
    items{
      icon
      status
      title
      url
    }
  }
}`;

export default function useMenu(customerId) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [menu, setMenu] = useState([]);

  const { refetch } = useQuery(GET_CUSTOMER_MENU, {
    variables: { customerId: customerId },
    skip: true, // Initially skip the query
  });

  useEffect(() => {
    setMenu(() => {
      const storedMenu = GetMenuFromLocalStorage(GetToken()?.environmentId);
      if (storedMenu) {
        return storedMenu;
      } else {
        setLoading(true);
        return undefined;
      }
    })
  }, []);

  useEffect(() => {
    if (customerId && menu == undefined) {
      refetch({ customerId: customerId })
        .then((result) => {
          let menuData = result.data;
          setLoading(false);
          SetMenuInLocalStorage(menuData, GetToken()?.environmentId);
          setMenu(menuData);
        })
        .catch((error) => {
          setLoading(false);
          setError(error);
          setMenu();
        });
    }
  }, [menu, customerId]);

  return { data: menu, loading, error };
}

const memoryStorage = new Map();

function GetMenu(customerId, onLoad) {
  const envId = GetToken()?.environmentId
  const storedMenu = GetMenuFromLocalStorage(envId);
  if (storedMenu) {
    onLoad(storedMenu);
  } else {
    Post('/graphql', { query: GET_CUSTOMER_MENU_PLAIN, variables: { customerId: customerId } },
      (r) => {
        let menuData = r.data;
        SetMenuInLocalStorage(menuData, envId);
        onLoad(menuData);
      },
      () => {
        onLoad();
      }
    );
  }
}

function ClearMenu() {
  memoryStorage.clear();
}

function GetMenuFromLocalStorage(key) {
  const tokenString = memoryStorage.get('menu_' + key);
  if (tokenString) {
    return JSON.parse(tokenString)
  }
  return null;
}

function SetMenuInLocalStorage(mnu, key) {
  const menuString = JSON.stringify(mnu);
  memoryStorage.set('menu_' + key, menuString);
}

export { useMenu, GetMenu, ClearMenu };