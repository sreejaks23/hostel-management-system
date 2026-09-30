import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FiPlus, FiSearch } from "react-icons/fi";
import api from "../api/axios.js";
import Loader from "../components/Loader.jsx";
import Badge from "../components/Badge.jsx";
import Modal from "../components/Modal.jsx";
import Pagination from "../components/Pagination.jsx";

const PAGE_SIZE = 10;

const emptyForm = {
  userId: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  gender: "male",
  address: "",
  occupation: "",
  preferredType: "",
  preferredBlock: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactRelationship: "",
};

const Residents = () => {
  const [residents, setResidents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [users, setUsers] = useState([]);

  const fetchResidents = async (targetPage = page) => {
    setLoading(true);
    try {
      const { data } = await api.get("/residents", { params: { search, page: targetPage, limit: PAGE_SIZE } });
      setResidents(data.residents);
      setTotal(data.total);
      setPage(targetPage);
    } catch {
      toast.error("Failed to load residents");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get("/users", { params: { role: "resident", limit: 100 } });
      setUsers(data.users);
    } catch {
      // ignore, admin-only endpoint
    }
  };

  useEffect(() => {
    fetchResidents(1);
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post("/residents", {
        userId: form.userId,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        gender: form.gender,
        address: form.address,
        occupation: form.occupation,
        roomPreferences: {
          type: form.preferredType || undefined,
          block: form.preferredBlock || undefined,
        },
        emergencyContact: {
          name: form.emergencyContactName,
          phone: form.emergencyContactPhone,
          relationship: form.emergencyContactRelationship,
        },
      });
      toast.success("Resident profile created");
      setShowCreate(false);
      setForm(emptyForm);
      fetchResidents(1);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create resident");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Residents</h1>
          <p className="text-gray-500 text-sm">Manage resident profiles and records</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <FiPlus /> New Resident Profile
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative max-w-sm w-full">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchResidents(1)}
          />
        </div>
        <button className="btn-outline" onClick={() => fetchResidents(1)}>Search</button>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Contact</th>
                <th className="py-2 pr-4">Room</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {residents.map((r) => (
                <tr key={r._id} className="border-b border-gray-100 last:border-0">
                  <td className="py-3 pr-4 font-medium text-gray-700">{r.firstName} {r.lastName}</td>
                  <td className="py-3 pr-4 text-gray-500">{r.email}<br />{r.phone}</td>
                  <td className="py-3 pr-4 text-gray-500">{r.room ? `${r.room.roomNumber} (${r.room.block})` : "—"}</td>
                  <td className="py-3 pr-4"><Badge status={r.status} /></td>
                  <td className="py-3 pr-4">
                    <Link to={`/residents/${r._id}`} className="text-gray-600 hover:underline">View</Link>
                  </td>
                </tr>
              ))}
              {residents.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-gray-400">No residents found.</td></tr>
              )}
            </tbody>
          </table>
          <Pagination page={page} limit={PAGE_SIZE} total={total} onPageChange={fetchResidents} />
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Resident Profile" wide>
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select required className="input sm:col-span-2" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
            <option value="">Select linked user account...</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
            ))}
          </select>
          <input required placeholder="First Name" className="input" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          <input required placeholder="Last Name" className="input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          <input required type="email" placeholder="Email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input required placeholder="Phone" className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <select className="input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          <input placeholder="Occupation" className="input" value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} />
          <input placeholder="Address" className="input sm:col-span-2" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />

          <p className="sm:col-span-2 text-sm font-medium text-gray-600 mt-2">Room Preferences (used to suggest matching rooms)</p>
          <select className="input" value={form.preferredType} onChange={(e) => setForm({ ...form, preferredType: e.target.value })}>
            <option value="">Any room type</option>
            <option value="single">Single</option>
            <option value="double">Double</option>
            <option value="triple">Triple</option>
            <option value="dormitory">Dormitory</option>
          </select>
          <input placeholder="Preferred block (e.g. A)" className="input" value={form.preferredBlock} onChange={(e) => setForm({ ...form, preferredBlock: e.target.value })} />

          <p className="sm:col-span-2 text-sm font-medium text-gray-600 mt-2">Emergency Contact</p>
          <input placeholder="Name" className="input" value={form.emergencyContactName} onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })} />
          <input placeholder="Relationship" className="input" value={form.emergencyContactRelationship} onChange={(e) => setForm({ ...form, emergencyContactRelationship: e.target.value })} />
          <input placeholder="Phone" className="input sm:col-span-2" value={form.emergencyContactPhone} onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })} />
          <button type="submit" className="btn-primary sm:col-span-2 mt-2">Create Resident Profile</button>
        </form>
      </Modal>
    </div>
  );
};

export default Residents;
