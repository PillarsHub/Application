import React, { useEffect } from 'react';
import { Children } from 'react';
import PropTypes from 'prop-types';

import "./offCanvas.css";

const OffCanvas = ({ id, showModal, children }) => {
    
    let canvasId = id ?? "offCanvasCard";

     useEffect(() => {
        if (showModal) {
            document.getElementById(canvasId).style.width = '100vw';
            document.getElementById(canvasId).style.maxWidth = '450px';
            document.getElementById(canvasId).style.right = '0px';
        } else{
            document.getElementById(canvasId).style.width = '450px';
            document.getElementById(canvasId).style.right = '-450px';
        }
    }, [showModal]); 
    
    
    return <>
        
        <div id={canvasId} className="card offCanvas">
            {Children.map(children, child =>
                <>{child}</>
            )}
        </div>

        {/* <a id="aabb" style={{display: 'none'}} data-bs-toggle="offcanvas" href="#offcanvasStart" role="button" aria-controls="offcanvasStart">
            Toggle offcanvas
        </a>

        <div className="offcanvas offcanvas-end" data-bs-scroll="true" data-bs-backdrop="false" tabIndex="-1" id="offcanvasStart" aria-labelledby="offcanvasStartLabel">
            <>
                {Children.map(children, child =>
                    <>{child}</>
                )}
            </>
        </div> */}
    </>
}

export default OffCanvas;

OffCanvas.propTypes = {
    id: PropTypes.string,
    showModal: PropTypes.bool.isRequired,
    children: PropTypes.any
}
