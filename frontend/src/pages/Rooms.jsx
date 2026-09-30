import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiPlus, FiUserPlus, FiUserMinus, FiRepeat, FiEdit2, FiTrash2 } from "react-icons/fi";
import api from "../api/axios.js";
import Loader from "../components/Loader.jsx";
import Badge from "../components/Badge.jsx";
import Modal from "../components/Modal.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const emptyRoom = { roomNumber: "", block: "", floor: 1, type: "single", capacity: 1, pricePerMonth: 0, amenities: "" };

const Rooms = () => {
  const { user } = useAuth();
  const isStaff = user?.role === "admin" || user?.role === "staff";
  const [rooms, setRooms] = useState([]);
  const [summary, setSummary] = useState({});
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "", type: "", search: "" });

  const [showCreate, setShowCreate] = useState(false);
  const [newRoom, setNewRoom] = useState(emptyRoom);
  const [assignModal, setAssignModal] = useState(null); // room object
  const [selectedResident, setSelectedResident] = useState("");

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;
      if (filters.search) params.search = filters.search;
      const { data } = await api.get("/rooms", { params });
      setRooms(data.rooms);
      setSummary(data.summary);
    } catch (err) {
      toast.error("Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  const fetchResidents = async () => {
    if (!isStaff) return;
    try {
      const { data } = await api.get("/residents", { params: { status: "pending", limit: 100 } });
      setResidents(data.residents);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.type]);

  useEffect(() => {
    fetchResidents();
  }, [isStaff]);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      await api.post("/rooms", {
        ...newRoom,
        floor: Number(newRoom.floor),
        capacity: Number(newRoom.capacity),
        pricePerMonth: Number(newRoom.pricePerMonth),
        amenities: newRoom.amenities ? newRoom.amenities.split(",").map((a) => a.trim()) : [],
      });
      toast.success("Room created");
      setShowCreate(false);
      setNewRoom(emptyRoom);
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create room");
    }
  };

  const handleAssign = async () => {
    if (!selectedResident) return toast.error("Select a resident");
    try {
      await api.post(`/rooms/${assignModal._id}/assign`, { residentId: selectedResident });
      toast.success("Resident assigned & checked in");
      setAssignModal(null);
      setSelectedResident("");
      fetchRooms();
      fetchResidents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign room");
    }
  };

  const handleCheckout = async (room, residentId) => {
    if (!confirm("Check out this resident from the room?")) return;
    try {
      await api.post(`/rooms/${room._id}/checkout`, { residentId });
      toast.success("Resident checked out");
      fetchRooms();
      fetchResidents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to check out");
    }
  };

  const handleDelete = async (room) => {
    if (!confirm(`Delete room ${room.roomNumber}?`)) return;
    try {
      await api.delete(`/rooms/${room._id}`);
      toast.success("Room deleted");
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete room");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rooms</h1>
          <p className="text-gray-500 text-sm">Real-time room availability & occupancy</p>
        </div>
        {isStaff && (
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <FiPlus /> Add Room
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {["total", "available", "occupied", "maintenance"].map((key) => (
          <div key={key} className="card text-center">
            <p className="text-xl font-bold text-gray-900">{summary[key] ?? 0}</p>
            <p className="text-xs text-gray-500 capitalize">{key}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          className="input max-w-xs"
          placeholder="Search room number..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && fetchRooms()}
        />
        <select className="input max-w-[160px]" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Statuses</option>
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="maintenance">Maintenance</option>
          <option value="reserved">Reserved</option>
        </select>
        <select className="input max-w-[160px]" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
          <option value="">All Types</option>
          <option value="single">Single</option>
          <option value="double">Double</option>
          <option value="triple">Triple</option>
          <option value="dormitory">Dormitory</option>
        </select>
        <button className="btn-outline" onClick={fetchRooms}>Search</button>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <div key={room._id} className="card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900">{room.roomNumber}</p>
                  <p className="text-xs text-gray-500">Block {room.block} • Floor {room.floor} • {room.type}</p>
                </div>
                <Badge status={room.status} />
              </div>
              <p className="text-sm text-gray-600 mb-1">Occupancy: {room.occupants?.length ?? 0}/{room.capacity}</p>
              <p className="text-sm text-gray-600 mb-3">${room.pricePerMonth}/month</p>
              {room.occupants?.length > 0 && (
                <div className="mb-3 space-y-1">
                  {room.occupants.map((o) => (
                    <div key={o._id} className="flex items-center justify-between text-xs bg-gray-50 rounded px-2 py-1">
                      <span>{o.firstName} {o.lastName}</span>
                      {isStaff && (
                        <button onClick={() => handleCheckout(room, o._id)} className="text-red-500 hover:text-red-700">
                          <FiUserMinus size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {isStaff && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {room.occupants?.length < room.capacity && room.status !== "maintenance" && (
                    <button onClick={() => setAssignModal(room)} className="btn-outline text-xs px-2 py-1">
                      <FiUserPlus size={14} /> Assign
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(room)}
                    disabled={room.occupants?.length > 0}
                    className="btn-outline text-xs px-2 py-1 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <FiTrash2 size={14} /> Delete
                  </button>
                </div>
              )}
            </div>
          ))}
          {rooms.length === 0 && <p className="text-gray-400 col-span-full text-center py-10">No rooms found.</p>}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Room">
        <form onSubmit={handleCreateRoom} className="space-y-3">
          <input required placeholder="Room Number (e.g. A-101)" className="input" value={newRoom.roomNumber} onChange={(e) => setNewRoom({ ...newRoom, roomNumber: e.target.value })} />
          <input required placeholder="Block (e.g. A)" className="input" value={newRoom.block} onChange={(e) => setNewRoom({ ...newRoom, block: e.target.value })} />
          <input required type="number" placeholder="Floor" className="input" value={newRoom.floor} onChange={(e) => setNewRoom({ ...newRoom, floor: e.target.value })} />
          <select className="input" value={newRoom.type} onChange={(e) => setNewRoom({ ...newRoom, type: e.target.value })}>
            <option value="single">Single</option>
            <option value="double">Double</option>
            <option value="triple">Triple</option>
            <option value="dormitory">Dormitory</option>
          </select>
          <input required type="number" placeholder="Capacity" className="input" value={newRoom.capacity} onChange={(e) => setNewRoom({ ...newRoom, capacity: e.target.value })} />
          <input required type="number" placeholder="Price per month" className="input" value={newRoom.pricePerMonth} onChange={(e) => setNewRoom({ ...newRoom, pricePerMonth: e.target.value })} />
          <input placeholder="Amenities (comma separated)" className="input" value={newRoom.amenities} onChange={(e) => setNewRoom({ ...newRoom, amenities: e.target.value })} />
          <button type="submit" className="btn-primary w-full">Create Room</button>
        </form>
      </Modal>

      <Modal open={!!assignModal} onClose={() => setAssignModal(null)} title={`Assign Resident to ${assignModal?.roomNumber || ""}`}>
        <div className="space-y-3">
          <select className="input" value={selectedResident} onChange={(e) => setSelectedResident(e.target.value)}>
            <option value="">Select a pending resident...</option>
            {residents.map((r) => (
              <option key={r._id} value={r._id}>{r.firstName} {r.lastName} ({r.email})</option>
            ))}
          </select>
          {residents.length === 0 && <p className="text-xs text-gray-400">No pending residents. Create one in Residents first.</p>}
          <button onClick={handleAssign} className="btn-primary w-full">Confirm Assignment</button>
        </div>
      </Modal>
    </div>
  );
};

export default Rooms;
