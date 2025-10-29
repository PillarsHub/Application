import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PageHeader, { CardHeader } from "../../components/pageHeader";
import { useFetch } from "../../hooks/useFetch";
import { SendRawRequest, SendRequest } from "../../hooks/usePost";
import DataLoading from "../../components/dataLoading";
import LocalDate from "../../util/LocalDate";
import Modal from "../../components/modal";
import TextArea from "../../components/textArea";
import CheckBox from "../../components/checkbox";
import MultiSelect from "../../components/muliselect";
import { GetScope } from "../../features/authentication/hooks/useToken"
import NoItems from '../../components/noItems';
import FileInput from '../../components/fileInput';

const MAX_DOCUMENT_SIZE = 25 * 1024 * 1024; // 25 MB (adjust the size as needed)
const MAX_THUMBNAIL_SIZE = 1024 * 1024; // 1 MB (adjust the size as needed)

const MediaList = () => {
  let params = useParams()
  const maxImages = 50;
  const showPublished = GetScope() != undefined || params.customerId != undefined;
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [activeItem, setActiveItem] = useState({});
  const [documentFile, setDocumentFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [searchTags, setSearchTags] = useState([]);
  const [searchLanguage, setSearchLanguage] = useState("");
  const [addTagValue, setAddTagValue] = useState('');
  const [addTagList, setAddTagList] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { data, loading, error, refetch } = useFetch('/api/v1/documents/find', { search: searchText, tags: searchTags, publishedOnly: showPublished, offset: 0, count: maxImages });
  const { data: tagData, loading: tagLoading, error: tagError, refetch: tagRefetch } = useFetch('/api/v1/documents/tags', { publishedOnly: showPublished });
  const { data: langData, loading: langLoading, error: lagError } = useFetch('/api/v1/Languages', { offset: 0, count: 100 });

  useEffect(() => {
    if (searchTags) {
      refetch({ search: searchText, tags: searchTags, publishedOnly: showPublished, offset: 0, count: maxImages });
    }
  }, [searchTags]);

  useEffect(() => {
    if (tagData) {
      setAddTagList(tagData);
    }
  }, [tagData]); // Dependency array, useEffect will run when searchTags changes


  if (loading || tagLoading || langLoading) return <DataLoading />;
  if (error) return `Error loading Documents ${error}`;
  if (lagError) return `Error loading Languages ${lagError}`;
  if (tagError) return `Error loading Tags ${tagError}`;

  const handleShowAdd = () => setShowAdd(true);
  const handleCloseAdd = () => {
    setActiveItem({});
    setShowAdd(false)
  }

  const handleShowEdit = () => setShowEdit(true);
  const handleCloseEdit = () => {
    setActiveItem({});
    setShowEdit(false)
  }

  const handleTagChange = (name, value) => {
    if (name === 'all') {
      setSearchTags([]);
    } else {
      if (value) {
        // Add the tag only if it's not already present
        setSearchTags(tags => [...new Set([...tags, name])]);
      } else {
        // Remove the tag from the array
        setSearchTags(tags => tags.filter(tag => tag !== name));
      }
    }
  };

  const handleLanguageFilterChange = (e) => {
    setSearchLanguage(e.target.value);
  }

  const handleChange = (name, value) => {
    setActiveItem(values => ({ ...values, [name]: value }))
  }

  const handleThumbnailFileChange = (name, file) => {
    if (file) {
      document.getElementById("thumbnailError").innerText = "";
      document.getElementById("thumbnail").classList.remove("is-invalid");

      if (file.size > MAX_THUMBNAIL_SIZE) {
        document.getElementById("thumbnailError").innerText = "File size is too large. Please select a smaller file.";
        document.getElementById("thumbnail").classList.add("is-invalid");
        return; // Stop the process
      }
      setThumbnailFile(file);
    }
  };

  const handleDocumentFileChange = (name, file) => {
    if (file) {
      document.getElementById("fileError").innerText = "";
      document.getElementById("file").classList.remove("is-invalid");

      if (file.size > MAX_DOCUMENT_SIZE) {
        document.getElementById("fileError").innerText = "File size is too large. Please select a smaller file.";
        document.getElementById("file").classList.add("is-invalid");
        return; // Stop the process
      }
      setDocumentFile(file);
    }
  };

  const handleEdit = (documentId) => {
    var document = data.find((d) => d.id == documentId);
    if (document) {
      document.linkType = "LF"
      setActiveItem(document);
      handleShowEdit(true);
    }
  }

  const handlePublish = (documentId) => {
    var document = data.find((d) => d.id == documentId);
    if (document) {
      document.published = document.published ? false : true;
      document.linkType = "LF"
      updateDocument(document, () => { });
    }
  }

  const handleHideDelete = () => setShowDelete(false);
  const handleShowDelete = (documentId) => {
    var document = data.find((d) => d.id == documentId);
    setActiveItem(document);
    setShowDelete(true);
  }

  const handleDelete = () => {
    if (activeItem) {
      setShowDelete(false);
      SendRequest("DELETE", `/api/v1/documents/${activeItem.id}`, null, () => {
        tagRefetch({ publishedOnly: showPublished });
        refetch({ search: searchText, tags: searchTags, publishedOnly: showPublished, offset: 0, count: maxImages });
      }, (error, code) => {
        alert(`${code}: ${error}`);
      });
    }
  }

  const handleSubmitAdd = (e) => {
    e.preventDefault();
    let valid = true;

    document.getElementById("titleError").innerText = "";
    document.getElementById("titleInput").classList.remove("is-invalid");
    document.getElementById("tagError").innerText = "";
    document.getElementById("tagInput").classList.remove("is-invalid");

    if ((activeItem.title ?? '') == '') {
      document.getElementById("titleError").innerText = "Media tag is required";
      document.getElementById("titleInput").classList.add("is-invalid");
      valid = false;
    }

    if ((activeItem.tags?.length ?? 0) < 1) {
      document.getElementById("tagError").innerText = "Media tag is required";
      document.getElementById("tagInput").classList.add("is-invalid");
      valid = false;
    }


    if (valid) {
      setShowAdd(false);
      updateDocument(activeItem, () => {
        setActiveItem({});
      });
    }
  }

  const handleSubmitEdit = (e) => {
    e.preventDefault();
    let valid = true;

    if (valid) {
      setShowEdit(false);
      updateDocument(activeItem, () => {
        setActiveItem({});
      });
    }
  }

  const updateDocument = (document, onComplete) => {
    const formData = new FormData();
    formData.append("id", document.id ?? 0);
    formData.append("title", document.title);
    formData.append("description", document.description);
    formData.append("language", document.language ?? "");
    formData.append("published", document.published ?? "");
    formData.append("thumbnailUrl", document.thumbnailUrl ?? "");
    if (document.linkType === "LF") {
      formData.append("url", document.url ?? "");
    } else {
      formData.append("file", documentFile);
    }
    formData.append("thumbnail", thumbnailFile);
    document.tags.forEach((tag) => formData.append("tags", tag));
    setIsUploading(true);

    SendRawRequest("PUT", '/api/v1/documents', null, formData, (data) => {
      setIsUploading(false);
      setThumbnailFile();
      setDocumentFile();
      tagRefetch({ publishedOnly: showPublished });
      refetch({ search: searchText, tags: searchTags, publishedOnly: showPublished, offset: 0, count: maxImages });
      onComplete(data);
    }, (error, code) => {
      setIsUploading(false);
      alert(`${code}: ${error}`);
    });
  }

  const handleSearchSubmit = async e => {
    e.preventDefault();
    refetch({ search: searchText, tags: searchTags, publishedOnly: showPublished, offset: 0, count: maxImages });
  }

  const handleAddTagInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      // Trigger handleAddTag when Enter key is pressed
      handleAddTag();
    }
  };

  const handleAddTagInputChange = (e) => {
    setAddTagValue(e.target.value);
  };

  const handleAddTag = () => {
    setAddTagList(v => [...v, addTagValue]);
    setAddTagValue("");
  }

  let filteredData = data?.filter(item => (searchLanguage === "" || item.language === searchLanguage));
  var hasScope = GetScope() != undefined || params.customerId != undefined;

  return <>
    <PageHeader title="Documents & Media" customerId={params.customerId}>
      <CardHeader>
        <div className="d-flex">
          <div className="me-3">
            <div className="input-icon">
              <form onSubmit={handleSearchSubmit} autoComplete="off">
                <div className="input-icon">
                  <input className="form-control" tabIndex="1" placeholder="Search Documents" value={searchText} onChange={e => setSearchText(e.target.value)} />
                  <span className="input-icon-addon">
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><circle cx="10" cy="10" r="7"></circle><line x1="21" y1="21" x2="15" y2="15"></line></svg>
                  </span>
                </div>
              </form>
            </div>
          </div>
          {!hasScope &&
            <button className="btn btn-primary" onClick={handleShowAdd}>
              Add Document
            </button>
          }
        </div>
      </CardHeader>
      <div className="container-xl">
        <div className="row">
          <div className="col-lg-3 col-xl-2">
            <div className="form-label">Media Tags</div>
            <div className="mb-2 border-bottom">
              <label className="form-check">
                <CheckBox value={searchTags.length == 0} name="all" onChange={handleTagChange} />
                <span className="form-check-label">All Tags</span>
              </label>
            </div>
            <div className="mb-4">
              {tagData && tagData.map((tag) => {
                return <label key={tag} className="form-check">
                  <CheckBox value={searchTags.includes(tag)} name={tag} onChange={handleTagChange} />
                  <span className="form-check-label">{tag}</span>
                </label>
              })}
            </div>
            <div className="form-label">Language</div>
            <div className="mb-4">
              <select className="form-select" name="languageFilter" value={searchLanguage} onChange={handleLanguageFilterChange}>
                <option value="">Any Language</option>
                {langData && langData.map((language) => {
                  return <option key={language.iso2} value={language.iso2} >{language.name}</option>
                })}
              </select>
            </div>
          </div>

          <div className="col-lg-9 col-xl-10 ">
            {filteredData && filteredData.length == 0 &&
              <NoItems />
            }

            <div className="row row-cards">
              {filteredData && filteredData.map((doc) => {
                return <div key={doc.id} className="col-sm-12 col-lg-6">

                  <div className="card">
                    <div className="row row-0">
                      <div className="col-5 col-md-3">
                        <a href={doc.url} target="blank">
                          <img src={doc.thumbnailUrl ?? '/images/noimage.jpg'} className="w-100 h-100 object-cover card-img-start" alt="" />
                        </a>
                      </div>
                      <div className="col">
                        <div className="card-header border-0 pb-0">
                          <h3 className="card-title">
                            <a href={doc.url} target="blank">{doc.title}</a>
                          </h3>
                          <div className="card-actions btn-actions">
                            {!hasScope && <>
                              <div className="col-auto">
                                <div className="dropdown">
                                  <a href="#" className="btn-action dropdown-toggle" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="19" r="1"></circle><circle cx="12" cy="5" r="1"></circle></svg>
                                  </a>
                                  <div className="dropdown-menu dropdown-menu-end" data-popper-placement="bottom-end">
                                    <button className="dropdown-item" onClick={() => handleEdit(doc.id)}>Edit</button>
                                    {doc.published && <button className="dropdown-item" onClick={() => handlePublish(doc.id)} >Unpublish</button>}
                                    {!doc.published && <button className="dropdown-item" onClick={() => handlePublish(doc.id)} >Publish</button>}
                                    <button className="dropdown-item text-danger" onClick={() => handleShowDelete(doc.id)}>Delete</button>
                                  </div>
                                </div>
                              </div>
                            </>}
                          </div>
                        </div>
                        <div className="card-body">
                          <p>{doc.description}</p>
                          <div className="divide-y">
                            <div>
                              <label className="row">
                                <span className="col">
                                  <small className="text-muted"> Updated on <LocalDate dateString={doc.lastModified} /></small>
                                </span>
                              </label>
                            </div>
                            <div>
                              <div className="row">
                                <span className="col">
                                  {doc.tags && doc.tags.map((tag) => {
                                    return <span key={tag} className="badge bg-blue-lt me-1">{tag}</span>
                                  })}
                                </span>
                                {!hasScope && <>
                                  <div className="col-auto">
                                    {!doc.published && <span className="badge badge-outline text-warning" onClick={handlePublish} >Not Published</span>}
                                  </div>
                                </>}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              })}

            </div>
          </div>
        </div>
      </div>
    </PageHeader>

    <Modal showModal={showDelete} size="sm" onHide={handleHideDelete} >
      <div className="modal-body">
        <div className="modal-title">Are you sure?</div>
        <div>Do you wish to delete &apos;<em>{activeItem.name}&apos;</em>?</div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-link link-secondary me-auto" data-bs-dismiss="modal">Cancel</button>
        <button type="button" className="btn btn-danger" onClick={handleDelete}>Delete Item</button>
      </div>
    </Modal>

    <Modal showModal={showAdd} onHide={handleCloseAdd}>
      <div className="modal-header">
        <h5 className="modal-title">Add Document</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">
        <div className="row">
          <div className="col-8">
            <div className="mb-3">
              <label className="form-label">Title</label>
              <input id="titleInput" className="form-control" name="title" value={activeItem.title || ""} onChange={(e) => handleChange(e.target.name, e.target.value)} />
              <span id="titleError" className="text-danger"></span>
            </div>
          </div>
          <div className="col-4">
            <div className="mb-3">
              <label className="form-label">Language</label>
              <select className="form-select" name="language" onChange={(e) => handleChange(e.target.name, e.target.value)} >
                <option value="">Unspecified</option>
                {langData && langData.map((language) => {
                  return <option key={language.iso2} value={language.iso2} >{language.name}</option>
                })}
              </select>
              <span className="text-danger"></span>
            </div>
          </div>
          <div className="col-12">
            <div className="mb-3">
              <label className="form-label">Description</label>
              <TextArea name="description" value={activeItem.description || ""} onChange={handleChange} />
              <span className="text-danger"></span>
            </div>
          </div>
          <div className="col-12">
            <div className="mb-3">
              <label className="form-label">Media Tags</label>
              <MultiSelect id="tagInput" className="form-select mb-1" name="tags" value={activeItem.tags || []} onChange={handleChange}>
                {addTagList && addTagList.map((tag) => {
                  return <option key={tag}>{tag}</option>
                })}
              </MultiSelect>
              <div className="input-group mb-2">
                <input className="form-control" placeholder='Add new tag' value={addTagValue} onChange={handleAddTagInputChange} onKeyDown={handleAddTagInputKeyDown} />
                <button className="btn" type="button" onClick={handleAddTag}>Add</button>
              </div>
              <span id="tagError" className="text-danger"></span>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-body">
        <div className="row">
          <div className="col-12">
            <div className="mb-3">
              <label className="form-label">Thumbnail</label>
              <FileInput accept="image/png, image/gif, image/jpeg" id="thumbnail" name="thumbnail" onChange={handleThumbnailFileChange} />
              <span id="thumbnailError" className="text-danger"></span>
              <small className="form-hint ms-1 mt-2">
                The thumbnail must be less than 1MB in size. Recommended size is 200 x 271 pixels
              </small>
            </div>
          </div>
          <div className="col-8">
            {activeItem.linkType === "LF" && <>
              <label className="form-label">Media Url</label>
              <input className="form-control" name="url" value={activeItem.url || ""} onChange={(e) => handleChange(e.target.name, e.target.value)} autoComplete='off' />
              <span className="text-danger"></span>
            </>}
            {activeItem.linkType != "LF" && <>
              <label className="form-label">Document</label>
              <FileInput id="file" name="file" onChange={handleDocumentFileChange} />
              <span id="fileError" className="text-danger"></span>
              <small className="form-hint mb-3 ms-1 mt-2">
                The document must be less than 25MB in size.
              </small>
            </>}
          </div>
          <div className="col-4">
            <label className="form-label">Media Type</label>
            <select className="form-select" name="linkType" value={activeItem.linkType || ""} onChange={(e) => handleChange(e.target.name, e.target.value)} >
              <option value="UL">Upload File</option>
              <option value="LF">Link File</option>
            </select>
            <span className="text-danger"></span>
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <a href="#" className="btn btn-link link-secondary" data-bs-dismiss="modal">
          Cancel
        </a>
        {isUploading && <>
          <button className="btn btn-primary ms-auto">
            <span className="spinner-border spinner-border-sm me-2" role="status"></span> Uploading
          </button>
        </>}
        {!isUploading && <>
          <button className="btn btn-primary ms-auto" onClick={handleSubmitAdd}>
            <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-upload" width="24" height="24" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2"></path><path d="M7 9l5 -5l5 5"></path><path d="M12 4l0 12"></path></svg>
            Upload File
          </button>
        </>}
      </div>
    </Modal >

    <Modal showModal={showEdit} onHide={handleCloseEdit}>
      <div className="modal-header">
        <h5 className="modal-title">Edit Document</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div className="modal-body">
        <div className="row">
          <div className="col-8">
            <div className="mb-3">
              <label className="form-label">Title</label>
              <input className="form-control" name="title" value={activeItem.title || ""} onChange={(e) => handleChange(e.target.name, e.target.value)} />
              <span className="text-danger"></span>
            </div>
          </div>
          <div className="col-4">
            <div className="mb-3">
              <label className="form-label">Language</label>
              <select className="form-select" name="language" value={activeItem.language || ''} onChange={(e) => handleChange(e.target.name, e.target.value)} >
                <option value="">Unspecified</option>
                {langData && langData.map((language) => {
                  return <option key={language.iso2} value={language.iso2} >{language.name}</option>
                })}
              </select>
              <span className="text-danger"></span>
            </div>
          </div>
          <div className="col-12">
            <div className="mb-3">
              <label className="form-label">Description</label>
              <TextArea name="description" value={activeItem.description || ""} onChange={handleChange} />
              <span className="text-danger"></span>
            </div>
          </div>
          <div className="col-12">
            <div className="mb-3">
              <label className="form-label">Media Tags</label>
              <MultiSelect className="form-select mb-1" name="tags" value={activeItem.tags || []} onChange={handleChange}>
                {addTagList && addTagList.map((tag) => {
                  return <option key={tag}>{tag}</option>
                })}
              </MultiSelect>
              <div className="input-group mb-2">
                <input className="form-control" placeholder='Add new tag' value={addTagValue} onChange={handleAddTagInputChange} onKeyDown={handleAddTagInputKeyDown} />
                <button className="btn" type="button" onClick={handleAddTag}>Add</button>
              </div>
              <span className="text-danger"></span>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <a href="#" className="btn btn-link link-secondary" data-bs-dismiss="modal">
          Cancel
        </a>
        <button className="btn btn-primary ms-auto" onClick={handleSubmitEdit}>
          Update Document
        </button>
      </div>
    </Modal >
  </>
}

export default MediaList;