import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import PropTypes from 'prop-types';
import parse from 'html-react-parser';

const SortableRow = ({ id, data, internalPages, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const mapStatus = (status) => {
    switch (status) {
      case "Enabled":
        return 'Visible';
      case "Corporate":
        return "Corporate";
      case "Disabled":
        return "Hidden";
    }
    return status;
  }

  var pageIndex = internalPages.findIndex(p => p.url?.toLowerCase() == data.url?.toLowerCase());
  let page = internalPages[pageIndex];

  return (
    <tr className={data.url ? '' : 'bg-light'} ref={setNodeRef} style={style}>
      <td>
        <span className="" {...listeners} {...attributes}>
          <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-grip-horizontal" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M5 9m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path><path d="M5 15m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path><path d="M12 9m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path><path d="M12 15m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path><path d="M19 9m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path><path d="M19 15m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"></path></svg>
        </span>
      </td>
      {data.url && <td>
        {data.icon && <span className="text-muted me-2 d-md-none d-lg-inline-block">{parse(data.icon)}</span>}
        {data.title}
      </td>}
      {!data.url && <th className="subheader">{data.title}</th>}
      <td>{page?.title ?? data.url}</td>
      <td>{mapStatus(data.status)}</td>
      <td className={`subheader ${data.url ? '' : 'pt-0 pb-0'}`} >
        <button href="/settings/dashboard" className="btn btn-ghost-secondary btn-icon" onClick={() => onEdit(data.id)}>
          <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1"></path><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z"></path><path d="M16 5l3 3"></path></svg>
        </button>
        <button className="btn btn-ghost-secondary btn-icon" onClick={() => onDelete(data.id)}>
          <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="40" height="40" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 7l16 0"></path><path d="M10 11l0 6"></path><path d="M14 11l0 6"></path><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path></svg>
        </button>
      </td>
    </tr>
  );
};

SortableRow.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  data: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    status: PropTypes.string
  }).isRequired,
  internalPages: PropTypes.array.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

export default SortableRow;
