import React from 'react';
import PropTypes from 'prop-types';



const Avatar = ({ name, url, size, block, className }) => {
    
    var backgroundColors =  ["#1abc9c", "#2ecc71", "#3498db", "#5D005D", "#34495e", "#16a085", "#27ae60", "#2980b9", "#8e44ad", "#2c3e50", "#1d273b", "#e67e22", "#e74c3c", "#de5d06", "#f39c12", "#d35400", "#c0392b", "#c13333", "#1592a6"];
    var textColors =        ["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"];

    size = size ?? 'tt';

    let shapClass = (block == null || block) ? "d-block avatar-rounded" : "mb-3 avatar-rounded";

    if (url != undefined && url != '')
    {
        return <span className={`avatar avatar-${size} ${shapClass}`} style={{backgroundImage: `url('${url}')`}} ></span>
    }
    
    if (name == undefined || name == '') return <></>;

    let initials = name.split(' ')[0].charAt(0).toUpperCase() + name.split(" ")[1].charAt(0).toUpperCase(),

    charIndex = name.charCodeAt(0) + name.charCodeAt(1),
    colorIndex = charIndex % 19;

    let avatarHeight = 40;
    let avatarWidth = 40;
    let fontWidth = 40;

    if(size == "xs") {
        avatarHeight = 24;
        avatarWidth = 24;
        fontWidth = 28;
    }

    if(size == "sm") {
        avatarHeight = 32;
        avatarWidth = 32;
        fontWidth = 32;
    }

    if(size == "md") {
        avatarHeight = 64;
        avatarWidth = 64;
        fontWidth = 64;
    }

    if(size == "lg") {
        avatarHeight = 80;
        avatarWidth = 80;
        fontWidth = 80;
    }

    if(size == "xl") {
        avatarHeight = 112;
        avatarWidth = 112;
        fontWidth = 100;
    }

    let avatarElement = {
        backgroundColor: backgroundColors[colorIndex],
        width: avatarWidth,
        height: avatarHeight,
        font : (fontWidth - 4) / 2 + "px Arial",
        color: textColors[colorIndex],
        textAlign: 'center',
        lineHeight: avatarHeight + 'px'
    }; 

    //return <span className={`avatar avatar-${size}`}>{initials}</span>

    return <span className={`avatar avatar-${size} ${shapClass} ${className}`} style={{overflow: 'hidden'}} >
        <div style={avatarElement} className={`avtar-${size}`}>{initials}</div>
    </span>
}

export default Avatar;

Avatar.propTypes = {
    name: PropTypes.string.isRequired,
    url: PropTypes.string,
    size: PropTypes.string,
    block: PropTypes.bool,
    className: PropTypes.string
}
