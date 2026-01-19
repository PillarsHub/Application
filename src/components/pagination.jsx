import React from 'react';
import PropTypes from 'prop-types';

const Pagination = ({ variables, refetch, total }) => {
  let vFirst = variables.first ?? variables.count;

  let pageSize = vFirst;
  let currentPage = Math.floor(variables.offset / pageSize) + 1;
  let lastPage = Math.ceil(total / pageSize);

  let displayTo = variables.offset + pageSize;
  let pageBegin = Math.max(2, currentPage - 2);
  let pageEnd = Math.min(lastPage - 1, currentPage + 2);

  if (currentPage <= 4) {
    pageBegin = 2;
    pageEnd = Math.min(6, lastPage - 1);
  } else if (currentPage >= lastPage - 3) {
    pageBegin = Math.max(2, lastPage - 5);
    pageEnd = lastPage - 1;
  }

  let pages = [1];
  if (total === -1) {
    lastPage = currentPage + 1;
  }

  for (let i = pageBegin; i <= pageEnd; i++) {
    pages.push(i);
  }
  pages.push(lastPage);

  return <>
    {total > -1 &&
      <p className="m-0 text-muted d-none d-sm-block">Showing <span>{variables.offset + 1}</span> to <span>{displayTo > total ? total : displayTo}</span> of <span>{total}</span> entries</p>
    }

    {lastPage > 1 &&
      <ul className="pagination m-0 ms-auto">
        <li className={`page-item ${currentPage == 1 ? 'disabled' : ''}`}>
          <button className="page-link" onClick={() => refetch({ offset: variables.offset - pageSize })} tabIndex="-1" aria-disabled="true">
            <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><polyline points="15 6 9 12 15 18" /></svg>
            prev
          </button>
        </li>

        {pages.map((page) => {
          return <li key={page} className="page-item">
            <button className={`page-link ${currentPage == page ? 'active' : ''}`} onClick={() => refetch({ offset: (page - 1) * pageSize })}>{page}</button>
          </li>
        })}

        <li className={`page-item ${currentPage == lastPage ? 'disabled' : ''}`}>
          <button className="page-link" onClick={() => refetch({ offset: variables.offset + pageSize })} aria-disabled="true">
            next
            <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><polyline points="9 6 15 12 9 18" /></svg>
          </button>
        </li>
      </ul>
    }
  </>
}

export default Pagination;

Pagination.propTypes = {
  variables: PropTypes.object.isRequired,
  refetch: PropTypes.func.isRequired,
  total: PropTypes.number.isRequired
}