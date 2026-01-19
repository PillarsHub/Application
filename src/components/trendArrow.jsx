import React from 'react';
import PropTypes from 'prop-types';


const TrendArrow = ({ trend }) => {
    
    let slope = Math.round(trend);

    if(slope > 0) {
        return <span className="text-green d-inline-flex align-items-center lh-1">
            {slope}%
            <svg xmlns="http://www.w3.org/2000/svg" className="icon ms-1" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><polyline points="3 17 9 11 13 15 21 7"></polyline><polyline points="14 7 21 7 21 14"></polyline></svg>
        </span>
    }

    if(slope < 0) {
        return <span className="text-red d-inline-flex align-items-center lh-1">
            {slope}%
            <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-trending-down" width="24" height="24" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M3 7l6 6l4 -4l8 8"></path><path d="M21 10l0 7l-7 0"></path></svg>
        </span>
    }

    return <span className="text-yellow d-inline-flex align-items-center lh-1">
            {slope}%
            <svg xmlns="http://www.w3.org/2000/svg" className="icon ms-1" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </span>
}

export default TrendArrow;

TrendArrow.propTypes = {
    trend: PropTypes.any.isRequired,
}
