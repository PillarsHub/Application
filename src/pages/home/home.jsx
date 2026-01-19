import React from 'react';
import { Navigate } from "react-router-dom";
import { GetScope } from "../../features/authentication/hooks/useToken.jsx"

const Home = () => {
  if (GetScope() == undefined) { return <Navigate to={`/customers`} /> }
  if (GetScope() !== undefined) { return <Navigate to={`/customers/${GetScope()}/dashboard`} /> }
};

export default Home;