import React, { useEffect, useState } from 'react';
import { useParams } from "react-router-dom"
import { useFetch } from "../../hooks/useFetch.js";
import { SendRequest, SendRawRequest } from "../../hooks/usePost.js";
import DataLoading from "../../components/dataLoading.jsx";
import PageHeader from '../../components/pageHeader.jsx';
import TextInput from '../../components/textInput.jsx';
import TextArea from '../../components/textArea.jsx';
import Switch from '../../components/switch.jsx';
import Editor from '../../components/editor.jsx';
import NumericInput from '../../components/numericInput.jsx';
import AvailabilityInput from '../../components/availabilityInput.jsx';
import FileInput from "../../components/fileInput.jsx";
import Modal from '../../components/modal.jsx';

const MAX_DOCUMENT_SIZE = 1024 * 1024; // 1 MB (adjust the size as needed)

const EditCourse = () => {
  const params = useParams()
  const courseId = params.courseId;
  const [activeItem, setActiveItem] = useState({ chapterId: -1, taskIndex: -1 });
  const { data, loading, error } = useFetch(courseId !== 'new' ? `/api/v1/Courses/${courseId}` : null);
  const [course, setCource] = useState({ id: 0 });
  const [processing, setProcessing] = useState();
  const [sizeError, setSizeError] = useState();
  const [saveState, setSaveState] = useState();
  const [showDelete, setShowDelete] = useState();

  useEffect(() => {
    if (data) {
      setCource(data);
    }
  }, [data])

  if (loading || course == null) return <DataLoading />;
  if (error) return `Error loading Documents ${error}`;

  const defaultImage = '/images/photos/buildings_and_people.png';

  const handleChange = (name, value) => {
    setCource(v => ({ ...v, [name]: value }));
  }

  const handleActiveItemChange = (name, value) => {
    setCource(v => {
      if (activeItem.chapterId > -1) {
        var chapter = v.chapters[activeItem.chapterId];
        if (activeItem.taskIndex > -1) {
          let task = chapter.tasks[activeItem.taskIndex];
          task = { ...task, [name]: value }
          chapter.tasks[activeItem.taskIndex] = task;
        } else {
          chapter = { ...chapter, [name]: value }
        }
        v.chapters[activeItem.chapterId] = chapter;
      } else {
        var realName = name == 'content' ? 'introduction' : name;
        return ({ ...v, [realName]: value });
      }
      return ({ ...v });
    });
  }

  const handleSetActiveChapter = (e, chapterIndex) => {
    e.preventDefault();
    setActiveItem({ chapterId: chapterIndex, taskIndex: -1 })
  }

  const handleSetActiveTask = (e, chapterId, index) => {
    e.preventDefault();
    setActiveItem({ chapterId: chapterId, taskIndex: index })
  }

  const handleAddChapter = () => {
    setCource(v => {
      var newChapter = { title: "A new chapter" };
      if (!v.chapters) v.chapters = [];
      var index = v.chapters.push(newChapter) - 1;
      setActiveItem({ chapterId: index, taskIndex: -1 })
      return ({ ...v });
    });
  }

  const handleDocumentFileChange = (name, file) => {
    setSizeError()
    if (file && file.size > MAX_DOCUMENT_SIZE) {
      setSizeError('The thumbnail must be less than 1MB in size. Please select a smaller file.')
    } else {
      setProcessing('image');
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name);
      formData.append("Description", "Corse Image");
      formData.append("category", "Corse_Images");

      SendRawRequest("PUT", '/api/v1/blobs', null, formData, (r) => {
        setProcessing();
        setCource(v => ({ ...v, thumbnail: r.url }));
      }, (error, code) => {
        alert(`${code}: ${error}`);
        setProcessing();
      });
    }
  };

  const handleAddTask = () => {
    setCource(v => {
      var chapter = v.chapters[activeItem.chapterId];
      if (chapter) {
        var newTask = { title: "A new task" };
        if (!chapter.tasks) chapter.tasks = [];
        var index = chapter.tasks.push(newTask) - 1;
        setActiveItem({ chapterId: activeItem.chapterId, taskIndex: index })
      }
      return ({ ...v });
    });
  }

  const handleHideDelete = () => setShowDelete(false);
  const handleShowDelete = () => {
    setShowDelete(true);
  }

  const handleDeleteTask = () => {

    if (activeItem.taskIndex == -1) {
      setCource(v => {
        v.chapters.splice(activeItem.chapterId, 1);
        return ({ ...v });
      });

      setActiveItem({ chapterId: activeItem.chapterId - 1, taskIndex: -1 })
    } else {
      setCource(v => {
        var chapter = v.chapters[activeItem.chapterId];
        if (chapter) {
          if (chapter.tasks) {
            chapter.tasks.splice(activeItem.taskIndex, 1);
          }
        }
        return ({ ...v });
      });

      setActiveItem({ chapterId: activeItem.chapterId, taskIndex: activeItem.taskIndex - 1 })
    }


    setShowDelete(false);
  }

  const handleSave = () => {
    var method = course.id > 0 ? "PUT" : "POST";
    var url = course.id > 0 ? `/api/v1/Courses/${course.id}` : `/api/v1/Courses`;

    SendRequest(method, url, course, (r) => {
      setCource(r);
      setSaveState({ code: 0, message: "Success" });
      setProcessing();
    }, (error, code) => {
      setSaveState({ code, message: error });
      setProcessing();
    })
  }

  const editLable = activeItem.taskIndex == -1 ? 'Chapter' : 'Task';
  const titleValue = activeItem.taskIndex == -1 ? course?.chapters?.[activeItem.chapterId]?.title : course.chapters[activeItem.chapterId]?.tasks[activeItem.taskIndex]?.title;
  const titleContent = activeItem.taskIndex == -1 ? course?.introduction : course?.chapters?.[activeItem.chapterId]?.tasks[activeItem.taskIndex]?.content ?? '';
  const offsetValue = activeItem.taskIndex == -1 ? course?.chapters?.[activeItem.chapterId]?.offset : 0;
  const hideInOffsetValue = activeItem.taskIndex == -1 ? course?.chapters?.[activeItem.chapterId]?.hideInOffset : false;

  return <>
    <PageHeader title="Edit Course" breadcrumbs={[{ title: 'Training Courses', link: `/training` }, { title: "Course" }]}>
      <div className="container-xl">
        <div className="row row-deck">

          <div className="col-4 mb-3">
            <div className="card">
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">Course Title</label>
                  <TextInput name="title" value={course.title} onChange={handleChange} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Course Description</label>
                  <TextArea name="description" value={course.description} onChange={handleChange} />
                </div>
                <div className="mb-3">
                  <Switch title="Published" name="published" value={course.published} onChange={handleChange} />
                </div>
              </div>
            </div>
          </div>

          <div className="col-4 mb-3">
            <AvailabilityInput name="availability" resourceName="course" value={course.availability ?? []} onChange={handleChange} />
          </div>

          <div className="col-md-4 mb-3">
            <div className="card">
              <div className="img-responsive img-responsive-21x9 card-img-top" style={{ backgroundImage: `url(${(course.thumbnail ?? '') == '' ? defaultImage : course.thumbnail})` }} ></div>
              <div className="card-footer">

                {processing && <span><span className="spinner-border spinner-border-sm me-1" role="status" /> Uploading Image</span>}
                {!processing && <>
                  <div className="input-group mb-2">
                    <TextInput name="thumbnail" value={course.thumbnail} onChange={handleChange} />
                    <FileInput button={true} id="file" accept="image/*" name="file" onChange={handleDocumentFileChange} className={`${sizeError ? 'is-invalid' : ''}`} />
                  </div>
                  <span className="invalid-feedback">{sizeError}</span>
                  <span className="text-danger">{sizeError}</span>
                </>}
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-3">

            <div className="card">
              <div className="list-group list-group-flush overflow-auto" style={{ maxHeight: "39rem" }}>

                <a href="#" className={`list-group-item list-group-item-action ${activeItem.chapterId == -1 ? 'active' : ''}`} onClick={(e) => handleSetActiveChapter(e, -1)} >
                  <strong>Course Introduction</strong>
                </a>

                {course.chapters && course.chapters.map((chapter, cIndex) => {
                  return <><a href="#" key={chapter.id} className={`list-group-item list-group-item-action ${activeItem.chapterId == cIndex && activeItem.taskIndex == -1 ? 'active' : ''}`} onClick={(e) => handleSetActiveChapter(e, cIndex)} >
                    <strong>{chapter.title}</strong>
                  </a>

                    {chapter.tasks && chapter.tasks.map((task, index) => {
                      return <a href="#" key={task.id} className={`list-group-item list-group-item-action ${activeItem.chapterId == cIndex && activeItem.taskIndex == index ? 'active' : ''}`} onClick={(e) => handleSetActiveTask(e, cIndex, index)}>
                        <span className="ms-4">{task.title}</span>
                      </a>
                    })}
                  </>
                })}
              </div>
              <div className="card-footer">
                <button className="btn btn-default w-100" onClick={handleAddChapter} >Add Chapter</button>
              </div>
            </div>

          </div>
          <div className="col-md-9 mb-3">
            <div className="card">
              <div className="card-body">
                {activeItem.chapterId != -1 && <>
                  <div className="row">
                    <div className="col-12">
                      <div className="mb-3">
                        <label className="form-label">{editLable} Title</label>
                        <TextInput name="title" value={titleValue} onChange={handleActiveItemChange} />
                      </div>
                    </div>
                    {activeItem.taskIndex == -1 && <>
                      <div className="col-md-4 mb-3">
                        <Switch name="hideInOffset" value={hideInOffsetValue} title={`Hide until Available`} onChange={handleActiveItemChange} />
                      </div>
                      <div className="col-md-8 mb-3"></div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Availability Time Offset (In Hours)</label>
                        <NumericInput name="offset" value={offsetValue} onChange={handleActiveItemChange} />
                      </div>

                    </>}
                  </div>
                </>}
                {(activeItem.chapterId == -1 || activeItem.taskIndex > -1) &&
                  <Editor mode="complex" height={500} name="content" value={titleContent} onChange={handleActiveItemChange} />
                }
              </div>
              {activeItem.chapterId != -1 && <div className="card-footer">
                <div className="row">
                  <div className="col">
                    <button className="btn btn-default" onClick={handleAddTask}>Add Task</button>
                  </div>
                  <div className="col-auto">
                    <button className="btn btn-danger" onClick={handleShowDelete}>Delete {editLable}</button>
                  </div>
                </div>
              </div>}
            </div>
          </div>

          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <button type="submit" className="btn btn-primary" onClick={handleSave}>Save</button>
                {saveState?.code > 0 && <span className="text-danger ms-2">{JSON.stringify(saveState)}</span>}
              </div>
            </div>
          </div>
        </div>

      </div>
    </PageHeader >

    <Modal showModal={showDelete} size="sm" centered={true} onHide={handleHideDelete} >
      <div className="modal-body">
        <div className="modal-title">Are you sure?</div>
        <div>Do you wish to delete &apos;<em>{titleValue}&apos;</em>?</div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-link link-secondary me-auto" data-bs-dismiss="modal">Cancel</button>
        <button type="button" className="btn btn-danger" onClick={handleDeleteTask}>Delete Item</button>
      </div>
    </Modal>
  </>
}

export default EditCourse;