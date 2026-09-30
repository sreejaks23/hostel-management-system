import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FiArrowLeft, FiSearch, FiCheckCircle } from "react-icons/fi";
import api from "../api/axios.js";
import Loader from "../components/Loader.jsx";
import Badge from "../components/Badge.jsx";
import Modal from "../components/Modal.jsx";

const ResidentDetail = () => {
  const { id } = useParams();
  const [resident, setResident] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showMatch, setShowMatch] = useState(false);
  const [matchLoading, setMatchLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [preferences, setPreferences] = useState({});
  const [assigningId, setAssigningId] = useState(null);

  const fetchResident = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/residents/${id}`);
      setResident(data.resident);
    } catch {
      toast.error("Failed to load resident");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResident();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const openMatchFinder = async () => {
    setShowMatch(true);
    setMatchLoading(true);
    try {
      const { data } = await api.get(`/residents/${id}/suggested-rooms`);
      setSuggestions(data.rooms);
      setPreferences(data.preferences);
    } catch {
      toast.error("Failed to load room suggestions");
    } finally {
      setMatchLoading(false);
    }
  };

  const handleAssign = async (room) => {
    setAssigningId(room._id);
    try {
      await api.post(`/rooms/${room._id}/assign`, { residentId: resident._id });
      toast.success(`Assigned to room ${room.roomNumber}`);
      setShowMatch(false);
      fetchResident();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign room");
    } finally {
      setAssigningId(null);
    }
  };

  if (loading) return <Loader full />;
  if (!resident) return <p className="text-gray-400">Resident not found.</p>;

  return (
    <div>
      <Link to="/residents" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <FiArrowLeft /> Back to Residents
      </Link>

      <div className="card mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{resident.firstName} {resident.lastName}</h1>
            <p className="text-sm text-gray-500">{resident.email} • {resident.phone}</p>
          </div>
          <Badge status={resident.status} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4 mt-4 text-sm">
          <div><p className="text-gray-400">Gender</p><p className="text-gray-700 capitalize">{resident.gender || "—"}</p></div>
          <div><p className="text-gray-400">Occupation</p><p className="text-gray-700">{resident.occupation || "—"}</p></div>
          <div><p className="text-gray-400">Address</p><p className="text-gray-700">{resident.address || "—"}</p></div>
          <div><p className="text-gray-400">Current Room</p><p className="text-gray-700">{resident.room ? `${resident.room.roomNumber} (${resident.room.block})` : "Unassigned"}</p></div>
          <div><p className="text-gray-400">Check-in Date</p><p className="text-gray-700">{resident.checkInDate ? new Date(resident.checkInDate).toDateString() : "—"}</p></div>
          <div><p className="text-gray-400">Emergency Contact</p><p className="text-gray-700">{resident.emergencyContact?.name} ({resident.emergencyContact?.relationship}) — {resident.emergencyContact?.phone}</p></div>
          <div>
            <p className="text-gray-400">Room Preference</p>
            <p className="text-gray-700 capitalize">
              {resident.roomPreferences?.type || resident.roomPreferences?.block
                ? `${resident.roomPreferences?.type || "Any type"}${resident.roomPreferences?.block ? `, Block ${resident.roomPreferences.block}` : ""}`
                : "Not specified"}
            </p>
          </div>
        </div>

        {!resident.room && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button onClick={openMatchFinder} className="btn-primary">
              <FiSearch /> Find Matching Room
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <p className="font-semibold text-gray-700 mb-3">Room History</p>
        <div className="space-y-2">
          {resident.roomHistory?.length ? (
            resident.roomHistory.map((h, idx) => (
              <div key={idx} className="flex justify-between text-sm bg-gray-50 rounded px-3 py-2">
                <span>{h.room?.roomNumber} ({h.room?.block})</span>
                <span className="text-gray-500">
                  {new Date(h.checkInDate).toDateString()} — {h.checkOutDate ? new Date(h.checkOutDate).toDateString() : "Present"}
                </span>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-sm">No room history yet.</p>
          )}
        </div>
      </div>

      <Modal open={showMatch} onClose={() => setShowMatch(false)} title="Suggested Rooms" wide>
        <p className="text-sm text-gray-500 mb-4">
          Ranked by match to {resident.firstName}'s stated preferences
          {preferences.type ? ` (${preferences.type}${preferences.block ? `, Block ${preferences.block}` : ""})` : " — no preferences on file, showing all available rooms"}.
        </p>
        {matchLoading ? (
          <Loader />
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {suggestions.map((room) => (
              <div key={room._id} className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-3">
                <div>
                  <p className="font-medium text-gray-800">
                    {room.roomNumber}{" "}
                    {room.matchScore > 0 && (
                      <span className="ml-1 inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                        <FiCheckCircle size={12} /> {room.matchReasons.join(", ")}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    Block {room.block} • Floor {room.floor} • {room.type} • {room.occupantsCount}/{room.capacity} occupied • ${room.pricePerMonth}/mo
                  </p>
                </div>
                <button
                  onClick={() => handleAssign(room)}
                  disabled={assigningId === room._id}
                  className="btn-outline text-xs px-3 py-1.5"
                >
                  {assigningId === room._id ? "Assigning..." : "Assign"}
                </button>
              </div>
            ))}
            {suggestions.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-6">No available rooms found.</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ResidentDetail;
