import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiCheck, FiTrash2, FiBell } from "react-icons/fi";
import api from "../api/axios.js";
import Loader from "../components/Loader.jsx";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/notifications");
      setNotifications(data.notifications);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch {
      // ignore
    }
  };

  const markAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      fetchNotifications();
    } catch {
      // ignore
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      fetchNotifications();
    } catch {
      // ignore
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <button onClick={markAllRead} className="btn-outline text-sm">Mark all as read</button>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n._id} className={`card flex items-start justify-between gap-3 ${!n.isRead ? "border-primary-200 bg-primary-50/30" : ""}`}>
              <div className="flex gap-3">
                <FiBell className={`mt-0.5 ${!n.isRead ? "text-gray-600" : "text-gray-300"}`} />
                <div>
                  <p className="font-medium text-gray-700 text-sm">{n.title}</p>
                  <p className="text-gray-500 text-sm">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {!n.isRead && (
                  <button onClick={() => markRead(n._id)} className="text-gray-400 hover:text-green-600" title="Mark as read">
                    <FiCheck />
                  </button>
                )}
                <button onClick={() => remove(n._id)} className="text-gray-400 hover:text-red-600" title="Delete">
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
          {notifications.length === 0 && <p className="text-gray-400 text-center py-10">No notifications yet.</p>}
        </div>
      )}
    </div>
  );
};

export default Notifications;
