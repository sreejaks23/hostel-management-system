import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FiPlus,
  FiMessageSquare,
  FiImage,
  FiX,
} from "react-icons/fi";

import api from "../api/axios.js";
import Loader from "../components/Loader.jsx";
import Badge from "../components/Badge.jsx";
import Modal from "../components/Modal.jsx";
import Pagination from "../components/Pagination.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const PAGE_SIZE = 9;

const emptyForm = {
  title: "",
  description: "",
  category: "other",
  priority: "medium",
};

const Maintenance = () => {
  const { user } = useAuth();

  const isStaff =
    user?.role === "admin" ||
    user?.role === "staff";

  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    status: "",
    priority: "",
  });

  const [showCreate, setShowCreate] = useState(false);

  const [form, setForm] = useState(emptyForm);

  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const [detail, setDetail] = useState(null);
  const [comment, setComment] = useState("");

  // ============================================================
  // GET MAINTENANCE REQUESTS
  // ============================================================
  const fetchRequests = async (targetPage = page) => {
    setLoading(true);

    try {
      const params = {
        page: targetPage,
        limit: PAGE_SIZE,
      };

      if (filters.status) {
        params.status = filters.status;
      }

      if (filters.priority) {
        params.priority = filters.priority;
      }

      const { data } = await api.get(
        "/maintenance",
        { params }
      );

      console.log(
        "MAINTENANCE LIST RESPONSE:",
        data
      );

      // Always make sure requests is an array
      const safeRequests = Array.isArray(
        data?.requests
      )
        ? data.requests
        : [];

      // Always make sure total is a number
      const safeTotal =
        Number(data?.total) || 0;

      setRequests(safeRequests);
      setTotal(safeTotal);
      setPage(targetPage);
    } catch (err) {
      console.error(
        "MAINTENANCE LOAD ERROR:",
        err
      );

      console.error(
        "STATUS:",
        err.response?.status
      );

      console.error(
        "DATA:",
        err.response?.data
      );

      console.error(
        "MESSAGE:",
        err.message
      );

      toast.error(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to load maintenance requests"
      );

      setRequests([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // LOAD REQUESTS WHEN FILTER CHANGES
  // ============================================================
  useEffect(() => {
    fetchRequests(1);

    // We intentionally only want this to run when filters change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // ============================================================
  // FILE SELECT
  // ============================================================
  const handleFileSelect = (e) => {
    const selected = Array.from(
      e.target.files || []
    ).slice(0, 5);

    setFiles(selected);
  };

  // ============================================================
  // REMOVE SELECTED FILE
  // ============================================================
  const removeFile = (idx) => {
    setFiles((previousFiles) =>
      previousFiles.filter(
        (_, i) => i !== idx
      )
    );
  };

  // ============================================================
  // CREATE MAINTENANCE REQUEST
  // ============================================================
  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      let images = [];

      // Upload images first
      if (files.length > 0) {
        setUploading(true);

        const formData = new FormData();

        files.forEach((file) => {
          formData.append(
            "images",
            file
          );
        });

        const { data } =
          await api.post(
            "/uploads",
            formData,
            {
              headers: {
                "Content-Type":
                  "multipart/form-data",
              },
            }
          );

        images = Array.isArray(
          data?.urls
        )
          ? data.urls
          : [];

        setUploading(false);
      }

      // Create maintenance request
      await api.post(
        "/maintenance",
        {
          ...form,
          images,
        }
      );

      toast.success(
        "Maintenance request submitted"
      );

      setShowCreate(false);
      setForm(emptyForm);
      setFiles([]);

      // Refresh list
      await fetchRequests(1);
    } catch (err) {
      setUploading(false);

      console.error(
        "CREATE MAINTENANCE ERROR:",
        err
      );

      toast.error(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to submit request"
      );
    }
  };

  // ============================================================
  // OPEN REQUEST DETAILS
  // ============================================================
  const openDetail = async (request) => {
    try {
      if (!request?._id) {
        toast.error(
          "Maintenance request not found"
        );
        return;
      }

      const { data } =
        await api.get(
          `/maintenance/${request._id}`
        );

      console.log(
        "MAINTENANCE DETAIL RESPONSE:",
        data
      );

      const requestData =
        data?.request;

      if (!requestData) {
        throw new Error(
          "Server did not return the maintenance request"
        );
      }

      // Make sure array fields are always arrays
      const safeRequest = {
        ...requestData,

        images: Array.isArray(
          requestData.images
        )
          ? requestData.images
          : [],

        comments: Array.isArray(
          requestData.comments
        )
          ? requestData.comments
          : [],
      };

      setDetail(safeRequest);
    } catch (err) {
      console.error(
        "OPEN MAINTENANCE ERROR:",
        err
      );

      toast.error(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to load request"
      );
    }
  };

  // ============================================================
  // UPDATE MAINTENANCE STATUS
  // ============================================================
  // const updateStatus = async (status) => {
  //   if (!detail?._id) {
  //     toast.error(
  //       "Maintenance request not found"
  //     );
  //     return;
  //   }

  //   try {
  //     console.log(
  //       "UPDATING STATUS:",
  //       status
  //     );

  //     console.log(
  //       "REQUEST ID:",
  //       detail._id
  //     );

  //     const { data } =
  //       await api.put(
  //         `/maintenance/${detail._id}`,
  //         {
  //           status,
  //         }
  //       );

  //     console.log(
  //       "STATUS UPDATE RESPONSE:",
  //       data
  //     );

  //     const updatedRequest =
  //       data?.request;

  //     if (!updatedRequest) {
  //       throw new Error(
  //         "Server did not return the updated request"
  //       );
  //     }

  //     // Keep existing values if the
  //     // backend does not return them.
  //     setDetail((previous) => {
  //       const previousData =
  //         previous || {};

  //       return {
  //         ...previousData,
  //         ...updatedRequest,

  //         images: Array.isArray(
  //           updatedRequest.images
  //         )
  //           ? updatedRequest.images
  //           : Array.isArray(
  //               previousData.images
  //             )
  //           ? previousData.images
  //           : [],

  //         comments: Array.isArray(
  //           updatedRequest.comments
  //         )
  //           ? updatedRequest.comments
  //           : Array.isArray(
  //               previousData.comments
  //             )
  //           ? previousData.comments
  //           : [],
  //       };
  //     });

  //     toast.success(
  //       "Status updated"
  //     );

  //     // Refresh maintenance list
  //     await fetchRequests(page);
  //   } catch (err) {
  //     console.error(
  //       "UPDATE STATUS ERROR:",
  //       err
  //     );

  //     console.error(
  //       "STATUS:",
  //       err.response?.status
  //     );

  //     console.error(
  //       "DATA:",
  //       err.response?.data
  //     );

  //     console.error(
  //       "MESSAGE:",
  //       err.message
  //     );

  //     toast.error(
  //       err.response?.data?.message ||
  //         err.response?.data?.error ||
  //         err.message ||
  //         "Failed to update"
  //     );
  //   }
  // };

  const updateStatus = async (status) => {
    if (!detail?._id) {
      toast.error("Maintenance request not found");
      return;
    }
  
    try {
      console.log("=================================");
      console.log("UPDATING MAINTENANCE REQUEST");
      console.log("REQUEST ID:", detail._id);
      console.log("STATUS:", status);
      console.log("URL:", `/maintenance/${detail._id}`);
      console.log("=================================");
  
      const { data } = await api.put(
        `/maintenance/${detail._id}`,
        {
          status: status,
        }
      );
  
      console.log("UPDATE RESPONSE:", data);
  
      if (!data?.request) {
        throw new Error(
          "Server did not return the updated request"
        );
      }
  
      setDetail({
        ...data.request,
        comments: Array.isArray(data.request.comments)
          ? data.request.comments
          : [],
        images: Array.isArray(data.request.images)
          ? data.request.images
          : [],
      });
  
      toast.success("Status updated successfully");
  
      await fetchRequests(page);
    } catch (err) {
      console.error(
        "================================="
      );
      console.error("UPDATE STATUS ERROR");
      console.error("=================================");
  
      console.error(
        "Message:",
        err.message
      );
  
      console.error(
        "Response:",
        err.response?.data
      );
  
      console.error(
        "Status:",
        err.response?.status
      );
  
      console.error(
        "================================="
      );
  
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to update status"
      );
    }
  };
  // ============================================================
  // ADD COMMENT
  // ============================================================
  const submitComment = async () => {
    if (!detail?._id) {
      toast.error(
        "Maintenance request not found"
      );
      return;
    }

    if (!comment.trim()) {
      return;
    }

    try {
      const { data } =
        await api.post(
          `/maintenance/${detail._id}/comments`,
          {
            message:
              comment.trim(),
          }
        );

      console.log(
        "COMMENT RESPONSE:",
        data
      );

      const updatedRequest =
        data?.request;

      if (!updatedRequest) {
        throw new Error(
          "Server did not return the updated request"
        );
      }

      setDetail((previous) => {
        const previousData =
          previous || {};

        return {
          ...previousData,
          ...updatedRequest,

          images: Array.isArray(
            updatedRequest.images
          )
            ? updatedRequest.images
            : Array.isArray(
                previousData.images
              )
            ? previousData.images
            : [],

          comments: Array.isArray(
            updatedRequest.comments
          )
            ? updatedRequest.comments
            : Array.isArray(
                previousData.comments
              )
            ? previousData.comments
            : [],
        };
      });

      setComment("");

      toast.success(
        "Update added"
      );
    } catch (err) {
      console.error(
        "COMMENT ERROR:",
        err
      );

      toast.error(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to add update"
      );
    }
  };

  // ============================================================
  // SAFE DATA FOR RENDERING
  // ============================================================
  const safeRequests = Array.isArray(
    requests
  )
    ? requests
    : [];

  const safeFiles = Array.isArray(
    files
  )
    ? files
    : [];

  const safeImages =
    Array.isArray(detail?.images)
      ? detail.images
      : [];

  const safeComments =
    Array.isArray(detail?.comments)
      ? detail.comments
      : [];

  // ============================================================
  // UI
  // ============================================================
  return (
    <div>
      {/* ======================================================
          HEADER
      ====================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Maintenance Requests
          </h1>

          <p className="text-gray-500 text-sm">
            {isStaff
              ? "Review and manage maintenance tasks"
              : "Submit and track your requests"}
          </p>
        </div>

        {!isStaff && (
          <button
            type="button"
            className="btn-primary"
            onClick={() =>
              setShowCreate(true)
            }
          >
            <FiPlus />
            New Request
          </button>
        )}
      </div>

      {/* ======================================================
          FILTERS
      ====================================================== */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          className="input max-w-[160px]"
          value={filters.status}
          onChange={(e) =>
            setFilters({
              ...filters,
              status: e.target.value,
            })
          }
        >
          <option value="">
            All Statuses
          </option>

          <option value="open">
            Open
          </option>

          <option value="assigned">
            Assigned
          </option>

          <option value="in_progress">
            In Progress
          </option>

          <option value="resolved">
            Resolved
          </option>

          <option value="closed">
            Closed
          </option>
        </select>

        <select
          className="input max-w-[160px]"
          value={filters.priority}
          onChange={(e) =>
            setFilters({
              ...filters,
              priority: e.target.value,
            })
          }
        >
          <option value="">
            All Priorities
          </option>

          <option value="low">
            Low
          </option>

          <option value="medium">
            Medium
          </option>

          <option value="high">
            High
          </option>

          <option value="urgent">
            Urgent
          </option>
        </select>
      </div>

      {/* ======================================================
          REQUEST LIST
      ====================================================== */}
      {loading ? (
        <Loader />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {safeRequests.map(
              (request) => {
                const requestImages =
                  Array.isArray(
                    request?.images
                  )
                    ? request.images
                    : [];

                return (
                  <div
                    key={request?._id}
                    className="card cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() =>
                      openDetail(request)
                    }
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-semibold text-gray-900">
                        {request?.title ||
                          "Untitled Request"}
                      </p>

                      <Badge
                        status={
                          request?.priority ||
                          "medium"
                        }
                      />
                    </div>

                    <p className="text-xs text-gray-500 mb-2">
                      Room{" "}
                      {request?.room
                        ?.roomNumber ||
                        "N/A"}{" "}
                      •{" "}
                      {request?.category ||
                        "other"}
                    </p>

                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {request?.description ||
                        "No description"}
                    </p>

                    {requestImages.length >
                      0 && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mb-2">
                        <FiImage
                          size={12}
                        />

                        {
                          requestImages.length
                        }{" "}
                        photo
                        {requestImages.length >
                        1
                          ? "s"
                          : ""}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <Badge
                        status={
                          request?.status ||
                          "open"
                        }
                      />

                      {request?.assignedTo && (
                        <span className="text-xs text-gray-400">
                          Assigned:{" "}
                          {request
                            .assignedTo
                            ?.name ||
                            "Staff"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              }
            )}

            {safeRequests.length ===
              0 && (
              <p className="text-gray-400 col-span-full text-center py-10">
                No maintenance requests
                found.
              </p>
            )}
          </div>

          {/* ==================================================
              PAGINATION
          ================================================== */}
          {total > PAGE_SIZE && (
            <div className="card mt-2">
              <Pagination
                page={page}
                limit={PAGE_SIZE}
                total={total}
                onPageChange={
                  fetchRequests
                }
              />
            </div>
          )}
        </>
      )}

      {/* ======================================================
          CREATE REQUEST MODAL
      ====================================================== */}
      <Modal
        open={showCreate}
        onClose={() =>
          setShowCreate(false)
        }
        title="Submit Maintenance Request"
      >
        <form
          onSubmit={handleCreate}
          className="space-y-3"
        >
          <input
            required
            placeholder="Title"
            className="input"
            value={form.title}
            onChange={(e) =>
              setForm({
                ...form,
                title: e.target.value,
              })
            }
          />

          <select
            className="input"
            value={form.category}
            onChange={(e) =>
              setForm({
                ...form,
                category:
                  e.target.value,
              })
            }
          >
            <option value="electrical">
              Electrical
            </option>

            <option value="plumbing">
              Plumbing
            </option>

            <option value="furniture">
              Furniture
            </option>

            <option value="cleaning">
              Cleaning
            </option>

            <option value="internet">
              Internet
            </option>

            <option value="appliance">
              Appliance
            </option>

            <option value="other">
              Other
            </option>
          </select>

          <select
            className="input"
            value={form.priority}
            onChange={(e) =>
              setForm({
                ...form,
                priority:
                  e.target.value,
              })
            }
          >
            <option value="low">
              Low
            </option>

            <option value="medium">
              Medium
            </option>

            <option value="high">
              High
            </option>

            <option value="urgent">
              Urgent
            </option>
          </select>

          <textarea
            required
            placeholder="Describe the issue..."
            rows={4}
            className="input"
            value={form.description}
            onChange={(e) =>
              setForm({
                ...form,
                description:
                  e.target.value,
              })
            }
          />

          {/* FILE UPLOAD */}
          <div>
            <label className="label">
              Photos (optional, up to 5)
            </label>

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={
                handleFileSelect
              }
              className="input"
            />

            {safeFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {safeFiles.map(
                  (file, idx) => (
                    <span
                      key={`${file.name}-${idx}`}
                      className="inline-flex items-center gap-1 text-xs bg-gray-100 rounded-full px-2 py-1"
                    >
                      {file.name}

                      <button
                        type="button"
                        onClick={() =>
                          removeFile(
                            idx
                          )
                        }
                        className="text-gray-400 hover:text-red-600"
                      >
                        <FiX
                          size={12}
                        />
                      </button>
                    </span>
                  )
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="btn-primary w-full"
          >
            {uploading
              ? "Uploading photos..."
              : "Submit Request"}
          </button>
        </form>
      </Modal>

      {/* ======================================================
          REQUEST DETAILS MODAL
      ====================================================== */}
      <Modal
        open={!!detail}
        onClose={() =>
          setDetail(null)
        }
        title={
          detail?.title ||
          "Maintenance Request"
        }
        wide
      >
        {detail && (
          <div className="space-y-4">
            {/* STATUS + PRIORITY */}
            <div className="flex flex-wrap gap-2">
              <Badge
                status={
                  detail.status ||
                  "open"
                }
              />

              <Badge
                status={
                  detail.priority ||
                  "medium"
                }
              />
            </div>

            {/* DESCRIPTION */}
            <p className="text-sm text-gray-600">
              {detail.description ||
                "No description"}
            </p>

            {/* ROOM + RESIDENT */}
            <p className="text-xs text-gray-400">
              Room{" "}
              {detail.room
                ?.roomNumber ||
                "N/A"}{" "}
              • Reported by{" "}
              {detail.resident
                ?.firstName ||
                ""}{" "}
              {detail.resident
                ?.lastName ||
                ""}
            </p>

            {/* ==================================================
                IMAGES
            ================================================== */}
            {safeImages.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {safeImages.map(
                  (src, idx) => (
                    <a
                      key={`${src}-${idx}`}
                      href={src}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={src}
                        alt="Maintenance issue"
                        className="h-20 w-20 object-cover rounded-lg border border-gray-200"
                      />
                    </a>
                  )
                )}
              </div>
            )}

            {/* ==================================================
                STATUS BUTTONS
            ================================================== */}
            {isStaff && (
              <div className="flex flex-wrap gap-2">
                {[
                  "assigned",
                  "in_progress",
                  "resolved",
                  "closed",
                ].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() =>
                      updateStatus(
                        status
                      )
                    }
                    className="btn-outline text-xs px-2 py-1 capitalize"
                  >
                    Mark{" "}
                    {status.replace(
                      "_",
                      " "
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* ==================================================
                COMMENTS / UPDATES
            ================================================== */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <FiMessageSquare />
                Updates
              </p>

              <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
                {safeComments.map(
                  (item, idx) => (
                    <div
                      key={
                        item?._id ||
                        idx
                      }
                      className="bg-gray-50 rounded px-3 py-2 text-sm"
                    >
                      <p className="font-medium text-gray-700 text-xs">
                        {item
                          ?.author
                          ?.name ||
                          "User"}
                      </p>

                      <p className="text-gray-600">
                        {item?.message ||
                          ""}
                      </p>
                    </div>
                  )
                )}

                {safeComments.length ===
                  0 && (
                  <p className="text-xs text-gray-400">
                    No updates yet.
                  </p>
                )}
              </div>

              {/* ADD COMMENT */}
              <div className="flex gap-2">
                <input
                  className="input"
                  placeholder="Add an update..."
                  value={comment}
                  onChange={(e) =>
                    setComment(
                      e.target.value
                    )
                  }
                />

                <button
                  type="button"
                  onClick={
                    submitComment
                  }
                  className="btn-primary"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Maintenance;