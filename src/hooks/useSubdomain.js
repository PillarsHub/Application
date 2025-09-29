import { useEffect, useState } from 'react';
//import { Get } from "../hooks/useFetch";

export default function useSubdomain() {
  const [subdomain, setSubdomain] = useState();

  useEffect(() => {
    const fetchSubdomain = async () => {
      const currentURL = window.location.hostname;

      // First, check if we have it in session storage
      //const cachedSubdomain = sessionStorage.getItem(currentURL);
      /*if (cachedSubdomain) {
        setSubdomain(cachedSubdomain);
        return;
      }*/

      //let path = '/api/v1/Theme?domain=' + encodeURIComponent(currentURL);

     /*  Get(path, (data) => {
        let d = ParseSubdomain();
        if (data.subdomain) {
          d = data.subDomain;
        }
        sessionStorage.setItem(currentURL, d); 
        setSubdomain(d);*/
     /*  }, () => { */
        let d = ParseSubdomain();
        sessionStorage.setItem(currentURL, d);
        setSubdomain(d);
     /* }) */
    };

    fetchSubdomain();
  }, [])

  const ParseSubdomain = () => {
    // Get the current URL
    const currentURL = window.location.hostname;

    if (currentURL === "backoffice.celesty.com") { return "celesty"; }
    if (currentURL === "backoffice.dreamtrips.com") { return "dreamtrips"; }
    if (currentURL === "office.aregobrands.com") { return "arego"; }

    // Split the URL by dots to get an array of subdomains
    const subdomains = currentURL.split('.');

    // Check if there is a subdomain (more than one part in the subdomains array)
    if (subdomains.length > 2) {
      // The first part of the subdomains array will be the subdomain
      const subdomain = subdomains[0];
      // Return the subdomain
      return subdomain;
    } else {
      // No subdomain found, return null
      return null;
    }
  };

  return {
    subdomain
  }
}

