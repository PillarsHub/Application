import { useEffect, useState } from 'react';

export default function useSubdomain() {
  const [subdomain, setSubdomain] = useState();

  useEffect(() => {
    setSubdomain(getSubdomain());
  }, [])

  const getSubdomain = () => {
    // Get the current URL
    const currentURL = window.location.hostname;

    if (currentURL === "backoffice.celesty.com") { return "celesty"; }

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

