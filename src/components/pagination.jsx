import React from 'react';
import PropTypes from 'prop-types';

const Pagination = ({ variables, refetch, total }) => {
  const vFirst = variables.first ?? variables.count;
  const pageSize = vFirst;

  const currentPage = Math.floor(variables.offset / pageSize) + 1;

  const unknownTotal = total === -1;

  // Only meaningful when total is known
  const lastPage = unknownTotal ? null : Math.max(1, Math.ceil(total / pageSize));

  const displayTo = variables.offset + pageSize;

  // Build page number window (only when total is known)
  let pages = [];
  if (!unknownTotal) {
    let pageBegin = Math.max(2, currentPage - 2);
    let pageEnd = Math.min(lastPage - 1, currentPage + 2);

    if (currentPage <= 4) {
      pageBegin = 2;
      pageEnd = Math.min(6, lastPage - 1);
    } else if (currentPage >= lastPage - 3) {
      pageBegin = Math.max(2, lastPage - 5);
      pageEnd = lastPage - 1;
    }

    pages = [1];

    for (let i = pageBegin; i <= pageEnd; i++) {
      pages.push(i);
    }

    if (lastPage > 1) {
      pages.push(lastPage);
    }
  }

  const showPagination = unknownTotal ? true : lastPage > 1;

  const canPrev = currentPage > 1;
  const canNext = unknownTotal ? true : currentPage < lastPage;

  const onPrev = () => refetch({ offset: variables.offset - pageSize });
  const onNext = () => refetch({ offset: variables.offset + pageSize });

  const ChevronLeft = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="icon"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <polyline points="15 6 9 12 15 18" />
    </svg>
  );

  const ChevronRight = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="icon"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );

  return (
    <>
      {total > -1 && (
        <p className="m-0 text-muted d-none d-sm-block">
          Showing <span>{variables.offset + 1}</span> to{' '}
          <span>{displayTo > total ? total : displayTo}</span> of <span>{total}</span> entries
        </p>
      )}

      {showPagination && (
        <>
          {unknownTotal ? (
            // Unknown total layout: Prev (left), Page X (center), Next (right)
            <div className="d-flex align-items-center ms-auto w-100">
              <div className="flex-fill d-flex justify-content-start">
                <ul className="pagination m-0">
                  <li className={`page-item ${!canPrev ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={onPrev} disabled={!canPrev} aria-disabled={!canPrev} >
                      {ChevronLeft}
                      prev
                    </button>
                  </li>
                </ul>
              </div>

              <div className="flex-fill d-flex justify-content-center">
                <ul className="pagination m-0">
                  <li className="page-item">
                    <span className="page-link">Page {currentPage}</span>
                  </li>
                </ul>
              </div>

              <div className="flex-fill d-flex justify-content-end">
                <ul className="pagination m-0">
                  <li className={`page-item ${!canNext ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={onNext}
                      disabled={!canNext}
                      aria-disabled={!canNext}
                    >
                      next
                      {ChevronRight}
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            // Known total layout: keep existing right-aligned pager
            <ul className="pagination m-0 ms-auto">
              <li className={`page-item ${!canPrev ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={onPrev}
                  disabled={!canPrev}
                  aria-disabled={!canPrev}
                >
                  {ChevronLeft}
                  prev
                </button>
              </li>

              {pages.map((page) => (
                <li key={page} className="page-item">
                  <button
                    className={`page-link ${currentPage == page ? 'active' : ''}`}
                    onClick={() => refetch({ offset: (page - 1) * pageSize })}
                  >
                    {page}
                  </button>
                </li>
              ))}

              <li className={`page-item ${!canNext ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={onNext}
                  disabled={!canNext}
                  aria-disabled={!canNext}
                >
                  next
                  {ChevronRight}
                </button>
              </li>
            </ul>
          )}
        </>
      )}
    </>
  );
};

export default Pagination;

Pagination.propTypes = {
  variables: PropTypes.object.isRequired,
  refetch: PropTypes.func.isRequired,
  total: PropTypes.number.isRequired,
};

export { Pagination };
