import React from 'react';


const NoItems = () => {
    return <>
        <div className="empty">
            <div className="empty-img"><img src="./static/illustrations/undraw_printing_invoices_5r4r.svg" height="128" alt="" />
            </div>
            <p className="empty-title">No results found</p>
            <p className="empty-subtitle text-muted">
                Try adjusting your search or filter to find what you are looking for.
            </p>
            {/* <div className="empty-action">
                <a href="./." className="btn btn-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Add your first client
                </a>
            </div> */}
        </div>
    </>
}

export default NoItems;