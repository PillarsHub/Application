import React from 'react';
import PropTypes from 'prop-types';

import SocialMediaIcon from './socialMediaIcon';

const SocialMediaLink = ({ socialMediaId, link }) => {
  return <a href={fixLink(socialMediaId, link)} className={`btn btn-${socialMediaId} btn-icon`} aria-label={socialMediaId} target="_blank" rel="noreferrer">
    <SocialMediaIcon socialMediaId={socialMediaId} />
  </a>
}

function fixLink(socialMediaId, value) {
  switch (socialMediaId) {
    case "facebook":
      return value ? `https://facebook.com/${value}` : 'https://facebook.com';
    case "instagram":
      return value ? `https://instagram.com/${value}` : 'https://instagram.com';
    case "pinterest":
      return value ? `https://pinterest.com/${value}` : 'https://pinterest.com';
    case "linkedIn":
      return value ? `https://linkedin.com/in/${value}` : 'https://linkedin.com';
    case "whatsApp":
      return value ? `https://wa.me/${value}` : 'https://wa.me';
    case "tikTok":
      return value ? `https://tiktok.com/@${value}` : 'https://tiktok.com';
    case "twitter":
      return value ? `https://twitter.com/${value}` : 'https://twitter.com';
    case "website":
      return value ? value : 'https://pillarshub.com';
    default:
      return JSON.stringify(socialMediaId);
  }
}

export default SocialMediaLink;

export const SocialMediaPlatforms = [
  { name: "website", placeholder: "Website URL" },
  { name: "twitter", placeholder: "X handle" },
  { name: "facebook", placeholder: "Facebook handle or username" },
  { name: "instagram", placeholder: "Instagram handle" },
  { name: "pinterest", placeholder: "Pinterest username" },
  { name: "linkedIn", placeholder: "LinkedIn username" },
  { name: "whatsApp", placeholder: "WhatsApp number" },
  { name: "tikTok", placeholder: "TikTok username" }
];

SocialMediaLink.propTypes = {
  socialMediaId: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired
}
