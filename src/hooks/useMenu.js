import { useState, useEffect } from 'react';
import { useQuery, gql } from "@apollo/client";
import { GetToken } from "../features/authentication/hooks/useToken";

var GET_CUSTOMER_MENU = gql`query ($customerId: String!) {
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
          let menus = result.data.menus;
          setLoading(false);
          SetMenuInLocalStorage(menus, GetToken()?.environmentId);
          setMenu(menus);
        })
        .catch((error) => {
          setLoading(false);
          setError(error);
          setMenu([]);
        });
    }
  }, [menu, customerId]);

  return { data: menu, loading, error };
}

const memoryStorage = new Map();

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

export { useMenu, ClearMenu };