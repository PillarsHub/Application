import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from "@dnd-kit/utilities";
import PropTypes from 'prop-types';
import Widget from '../../features/widgets/components/widget.jsx';
import EmptyContent from '../../components/emptyContent.jsx';

const SortGridItem = ({ id, col, item, widgets, trees, pageId, onAdd, onResize, onDelete, onPublish }) => {
  const { attributes, listeners, setNodeRef, isDragging, transform, transition, isOver } = useSortable({ id });

  const doTransofrm = false;

  const style = {
    zIndex: isDragging ? 999 : 'auto',
    transform: doTransofrm ? CSS.Transform.toString(transform) : '',
    transition,
    opacity: isDragging ? 0.7 : isOver ? 0.2 : 1
  };

  let widget = widgets.find((w) => w.id === item?.widgetId ?? '');

  const editUrl = `/settings/pages/${pageId}/widgets/${widget?.id}`;

  return <>
    <div className={`col-md-${col}`} ref={setNodeRef} style={style}>
      <div className="card">
        <div className="drag-handle bg-light">
          <div className="col m-1 drag-handle-dots" {...listeners} {...attributes}>
            <span className="pt-0 ms-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-grip-horizontal" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M5 9m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path><path d="M5 15m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path><path d="M12 9m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path><path d="M12 15m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path><path d="M19 9m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path><path d="M19 15m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path></svg>
            </span>
          </div>
          {widget?.state == 1 && <div className="col-auto p-0 bg-light me-0">
            <span className="badge badge-outline text-warning" >Not Published</span>
          </div>}
          <div className="col-auto p-0 bg-light">
            <div className="nav-item dropdown">
              <a className="btn-action nav-link dropdown-toggle" href="#navbar-base" data-bs-toggle="dropdown" data-bs-auto-close="true" role="button" aria-expanded="false" >
                <span className="nav-link-title">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="19" r="1"></circle><circle cx="12" cy="5" r="1"></circle></svg>
                </span>
              </a>
              <span data-toggle="dropdown"></span>
              <div className="dropdown-menu dropdown-menu-end">
                {!item?.widgetId && item?.children && <a className="dropdown-item" href="" onClick={(e) => { onAdd(item.id); e.preventDefault(); }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon dropdown-item-icon icon-tabler icon-tabler-layout-grid-add" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"></path><path d="M14 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"></path><path d="M4 14m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"></path><path d="M14 17h6m-3 -3v6"></path></svg>
                  Add widget
                </a>}
                {widget && item?.widgetId && <a className="dropdown-item" href={editUrl}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon dropdown-item-icon icon-tabler icon-tabler-edit" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1"></path><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z"></path><path d="M16 5l3 3"></path></svg>
                  Edit widget
                </a>}
                {(item?.children?.length ?? 0) == 0 && <>
                  <a className="dropdown-item" href="#" onClick={(e) => { onPublish(item.id, widget?.state == 1); e.preventDefault(); }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon dropdown-item-icon icon-tabler icons-tabler-outline icon-tabler-scan-eye"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4 8v-2a2 2 0 0 1 2 -2h2" /><path d="M4 16v2a2 2 0 0 0 2 2h2" /><path d="M16 4h2a2 2 0 0 1 2 2v2" /><path d="M16 20h2a2 2 0 0 0 2 -2v-2" /><path d="M7 12c3.333 -4.667 6.667 -4.667 10 0" /><path d="M7 12c3.333 4.667 6.667 4.667 10 0" /><path d="M12 12h-.01" /></svg>
                    {widget?.state == 1 && <span>Publish Widget</span>}
                    {widget?.state != 1 && <span>Unpublish Widget</span>}
                  </a>
                </>}
                {(item?.children?.length ?? 0) == 0 && <>
                  <a className="dropdown-item" href="#" onClick={(e) => { onDelete(item.id); e.preventDefault(); }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon dropdown-item-icon icon-tabler icons-tabler-outline icon-tabler-square-x"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M3 5a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-14z" /><path d="M9 9l6 6m0 -6l-6 6" /></svg>
                    Remove from Page
                  </a>
                </>}
                <div className="dropdown-divider"></div>
                <h6 className="dropdown-header">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon dropdown-item-icon icon-tabler icons-tabler-outline icon-tabler-ruler-measure"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M19.875 12c.621 0 1.125 .512 1.125 1.143v5.714c0 .631 -.504 1.143 -1.125 1.143h-15.875a1 1 0 0 1 -1 -1v-5.857c0 -.631 .504 -1.143 1.125 -1.143h15.75z" /><path d="M9 12v2" /><path d="M6 12v3" /><path d="M12 12v3" /><path d="M18 12v3" /><path d="M15 12v2" /><path d="M3 3v4" /><path d="M3 5h18" /><path d="M21 3v4" /></svg>
                  Widget Size
                </h6>
                <a href="#" className={`dropdown-item ${item?.columns == 3 ? 'active' : ''}`} onClick={(e) => { onResize(item.id, 3); e.preventDefault(); }}>
                  25%
                </a>
                <a href="#" className={`dropdown-item ${item?.columns == 4 ? 'active' : ''}`} onClick={(e) => { onResize(item.id, 4); e.preventDefault(); }}>
                  33%
                </a>
                <a href="#" className={`dropdown-item ${item?.columns == 6 ? 'active' : ''}`} onClick={(e) => { onResize(item.id, 6); e.preventDefault(); }}>
                  50%
                </a>
                <a href="#" className={`dropdown-item ${item?.columns == 8 ? 'active' : ''}`} onClick={(e) => { onResize(item.id, 8); e.preventDefault(); }}>
                  66%
                </a>
                <a href="#" className={`dropdown-item ${item?.columns == 9 ? 'active' : ''}`} onClick={(e) => { onResize(item.id, 9); e.preventDefault(); }}>
                  75%
                </a>
                <a href="#" className={`dropdown-item ${item?.columns == 12 ? 'active' : ''}`} onClick={(e) => { onResize(item.id, 12); e.preventDefault(); }}>
                  100%
                </a>

              </div>
            </div>
          </div>
        </div>
        {item?.widgetId && <Widget widget={widget} isPreview={true} trees={trees} />}
        {!item?.widgetId && item?.children.length == 0 && <>
          <div className="card m-0 p-1 card-borderless card-transparent">
            <div className="row row-cards row-deck">
              <EmptyContent title="Empty Container" text="Use the drop down menu to add widgets to this container" />
            </div>
          </div>
        </>}
        {!item?.widgetId && item?.children.length > 0 &&
          <div className="card m-0 p-1 card-borderless card-transparent">
            <div className="row row-cards row-deck">
              {item.children.map((child) => {
                return <SortGridItem key={child.id} id={child.id} col={child.columns} item={child} widgets={widgets} trees={trees} onAdd={onAdd} onResize={onResize} onDelete={onDelete} onPublish={onPublish} />
              })}
            </div>
          </div>
        }
      </div>
    </div >
  </>
};

SortGridItem.propTypes = {
  id: PropTypes.string.isRequired,
  col: PropTypes.string.isRequired,
  item: PropTypes.any.isRequired,
  widgets: PropTypes.arrayOf(PropTypes.object).isRequired,
  trees: PropTypes.any.isRequired,
  pageId: PropTypes.string,
  onAdd: PropTypes.func.isRequired,
  onResize: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onPublish: PropTypes.func.isRequired
};

export default SortGridItem;