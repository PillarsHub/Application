import React, { Children } from "react";
import PropTypes from 'prop-types';
import { WidgetTypes } from "../../../features/widgets/hooks/useWidgets.jsx";

const PlaceholderCard = ({ cardId, widget, onSwap, onMove, onEdit, onDelete, children }) => {
  let content = [];

  Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    content.push(child);
  });
  let canDrop = content.length === 0;

  const handleDrag = (e) => {
    e.dataTransfer.setData("widgetId", e.target.getAttribute('data-widgetId'));

    const parentElement = document.getElementById(`wdg_${cardId}`);
    const dragEvent = new Event("dragstart", { bubbles: true });
    parentElement.dispatchEvent(dragEvent);
  }

  const handleDrop = (e) => {
    if (canDrop) {
      e.preventDefault();
      var source = e.dataTransfer.getData("widgetId");
      var target = e.currentTarget.getAttribute('data-widgetId');
      onSwap(source, target);
    } else{
      e.preventDefault();
    }
  }

  const allowDrop = (e) => {
    if (canDrop) e.preventDefault();
  }

  const handleHDrop = (e) => {
    e.preventDefault();
    if (!canDrop) {
      var source = e.dataTransfer.getData("widgetId");
      var target = e.currentTarget.getAttribute('data-widgetId');
      onMove(source, target);
    }
  }

  const allowHDrop = (e) => {
    e.preventDefault();
  }

  const handleEdit = (id) => {
    onEdit(id);
  }

  const handleDelete = (id) => {
    onDelete(id);
  }

  return <div id={`wdg_${cardId}`} data-widgetId={cardId} className={`card mb-3 ${canDrop ? 'bg-light' : ''}`} onDragOver={allowDrop} onDrop={handleDrop}>
    <div className="row" onDragOver={allowHDrop} data-widgetId={cardId} onDrop={handleHDrop}>
      <div className="col-auto">
        {onMove && <span className="ms-1" draggable="true" data-widgetId={cardId} onDragStart={handleDrag}>
          <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-grip-horizontal" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M5 9m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path><path d="M5 15m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path><path d="M12 9m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path><path d="M12 15m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path><path d="M19 9m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path><path d="M19 15m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path></svg>
        </span>}
      </div>
      <div className="col text-center">
        {canDrop && (widget?.name ?? '[Deleted]')}
      </div>
      <div className="col-auto p-0">
        {onEdit && <button className="btn-link text-muted btn-icon" onClick={() => handleEdit(cardId)}>
          <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-edit" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1"></path><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z"></path><path d="M16 5l3 3"></path></svg>
        </button>}
      </div>
      <div className="col-auto p-0 pe-2">
        {onDelete && <button className="btn-link text-muted btn-icon pe-1" onClick={() => handleDelete(cardId)}>
          <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-trash" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 7l16 0"></path><path d="M10 11l0 6"></path><path d="M14 11l0 6"></path><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path></svg>
        </button>}
      </div>
    </div>
    {!canDrop && content}
    {canDrop && GetBodyById(widget?.type)}
  </div>
}

function GetBodyById(type) {
  if (type == WidgetTypes.Profile) return GetProfileBody();
  if (type == WidgetTypes.Card) return GetCardBody();
  if (type == WidgetTypes.Banner) return GetBannerBody();
  if (type == WidgetTypes.Rank) return GetRankBody();
  if (type == WidgetTypes.Upline) return GetUplineBody();
  if (type == WidgetTypes.Calendar) return GetCalendarBody();

  return GetGenericBody();
}

function GetProfileBody() {
  return <div className="card-body py-4 text-center">
    <div>
      <div className="avatar avatar-rounded avatar-lg placeholder mb-3 cursor-default"></div>
    </div>
    <div className="mt w-75 mx-auto">
      <div className="placeholder col-9 mb-3 cursor-default"></div>
      <div className="placeholder placeholder-xs col-10 cursor-default"></div>
    </div>
  </div>
}

function GetCardBody() {
  return <div className="card-body text-end">
    <div className="placeholder col-9 mb-4 cursor-default"></div>
    <div className="placeholder placeholder-xs col-10 cursor-default"></div>
    <div className="placeholder placeholder-xs col-12 cursor-default"></div>
    <div className="placeholder placeholder-xs col-11 cursor-default"></div>
    <div className="placeholder placeholder-xs col-8 cursor-default"></div>
    <div className="placeholder placeholder-xs col-10 cursor-default"></div>
    <div className="placeholder placeholder-xs col-12 cursor-default"></div>
    <div className="placeholder placeholder-xs col-12 cursor-default"></div>
  </div>
}

function GetBannerBody() {
  return <>
    <div className="ratio card-img-top placeholder cursor-default" style={{ minHeight: '150px' }}></div>
    <div className="card-body">
      <div className="placeholder col-12 cursor-default"></div>
    </div></>
}

function GetRankBody() {
  return <div className="card-body text-center">
    <div className="placeholder placeholder-lg col-9 mb-3 cursor-default"></div>
    <div className="placeholder placeholder-xs col-10 cursor-default"></div>
    <div className="placeholder placeholder-xs col-12 cursor-default"></div>
  </div>
}

function GetUplineBody() {
  return <div className="text-end">
    <ul className="list-group list-group-flush cursor-default">
      <li className="list-group-item">
        <div className="row align-items-center">
          <div className="col-auto">
            <div className="avatar avatar-rounded placeholder cursor-default"></div>
          </div>
          <div className="col-7">
            <div className="placeholder placeholder-xs col-9 cursor-default"></div>
            <div className="placeholder placeholder-xs col-7 cursor-default"></div>
          </div>
          <div className="col-2 ms-auto text-end">
            <div className="placeholder placeholder-xs col-8 cursor-default"></div>
            <div className="placeholder placeholder-xs col-10 cursor-default"></div>
          </div>
        </div>
      </li>
      <li className="list-group-item">
        <div className="row align-items-center">
          <div className="col-auto">
            <div className="avatar avatar-rounded placeholder cursor-default"></div>
          </div>
          <div className="col-7">
            <div className="placeholder placeholder-xs col-9 cursor-default"></div>
            <div className="placeholder placeholder-xs col-7 cursor-default"></div>
          </div>
          <div className="col-2 ms-auto text-end">
            <div className="placeholder placeholder-xs col-8 cursor-default"></div>
            <div className="placeholder placeholder-xs col-10 cursor-default"></div>
          </div>
        </div>
      </li>
    </ul>
  </div>
}

function GetCalendarBody() {
  const placeholders = Array.from({ length: 60 }, (_, index) => (
    <div key={index} className="placeholder me-1 ms-1 placeholder-lg col-2 cursor-default"></div>
  ));

  return <div className="card-body text-end">
    <div className="placeholder col-12 mb-3 cursor-default cursor-default"></div>
    {placeholders}
  </div>;
}

function GetGenericBody() {
  return <div className="card-body text-end">
    <div className="placeholder col-9 mb-3"></div>
    <div className="placeholder placeholder-xs col-10 cursor-default"></div>
    <div className="placeholder placeholder-xs col-12 cursor-default"></div>
    <div className="placeholder placeholder-xs col-11 cursor-default"></div>
    <div className="placeholder placeholder-xs col-8 cursor-default"></div>
    <div className="placeholder placeholder-xs col-10 cursor-default"></div>
  </div>
}

export default PlaceholderCard;

PlaceholderCard.propTypes = {
  cardId: PropTypes.string.isRequired,
  widget: PropTypes.any.isRequired,
  onSwap: PropTypes.func.isRequired,
  onMove: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  children: PropTypes.any
}
