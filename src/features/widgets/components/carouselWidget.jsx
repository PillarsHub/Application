import React, { useState } from "react";
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid'; // Using uuid library for fallback
import EmptyContent from "../../../components/emptyContent";

const CarouselWidget = ({ widget }) => {
  const [carouselId] = useState(() => 'carousel_' + generateUUID());

  return <>
    {(widget?.panes?.length ?? 0) == 0 && <>
      <EmptyContent />
    </>}

    <div id={carouselId} className="carousel slide" data-bs-ride="carousel">
      <div className="carousel-inner content-bottom">
        {widget.panes && widget.panes.map((p, index) => {
          let active = index === 0; // Set 'active' to true for the first item
          return (
            <div key={p.title} className={`carousel-item ${active ? 'active' : ''}`}>
              <div className="image-container">
                <img className="img-fluid" alt="" src={p.imageUrl} />
              </div>
              {p.title && <> <div className="carousel-caption-background d-none d-md-block"></div>
                <div className="carousel-caption">
                  <h1>{p.title}</h1>
                  <p>{p.text}</p>
                </div></>}
            </div>
          );
        })}
      </div>
      {widget.panes && widget.panes.length > 1 && <>
        <a className="carousel-control-prev" href={`#${carouselId}`} role="button" data-bs-slide="prev">
          <span className="carousel-control-prev-icon" aria-hidden="true"></span>
          <span className="visually-hidden">Previous</span>
        </a>
        <a className="carousel-control-next" href={`#${carouselId}`} role="button" data-bs-slide="next">
          <span className="carousel-control-next-icon" aria-hidden="true"></span>
          <span className="visually-hidden">Next</span>
        </a>
      </>}
    </div>
  </>

}

const generateUUID = () => {
  try {
    return crypto.randomUUID().replace(/-/g, '_');
  } catch (e) {
    return uuidv4().replace(/-/g, '_');
  }
};

export default CarouselWidget;

CarouselWidget.propTypes = {
  widget: PropTypes.object.isRequired
}