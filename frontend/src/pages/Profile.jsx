import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios.js";
import Loader from "../components/Loader.jsx";
import Badge from "../components/Badge.jsx";

const Profile = () => {
  const [resident, setResident] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get("/residents/me/profile");
        setResident(data.resident);
      } catch (err) {
        if (err.response?.status !== 404) toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return <Loader full />;

  if (!resident) {
    return (
      <div className="card text-center py-10">
        <p className="text-gray-500">No resident profile has been created for your account yet.</p>
        <p className="text-sm text-gray-400 mt-1">Please contact hostel staff to complete your onboarding.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-lg font-semibold text-gray-900">{resident.firstName} {resident.lastName}</p>
            <p className="text-sm text-gray-500">{resident.email}</p>
          </div>
          <Badge status={resident.status} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div><p className="text-gray-400">Phone</p><p className="text-gray-700">{resident.phone}</p></div>
          <div><p className="text-gray-400">Gender</p><p className="text-gray-700 capitalize">{resident.gender || "—"}</p></div>
          <div><p className="text-gray-400">Room</p><p className="text-gray-700">{resident.room ? `${resident.room.roomNumber} (Block ${resident.room.block})` : "Not assigned yet"}</p></div>
          <div><p className="text-gray-400">Check-in Date</p><p className="text-gray-700">{resident.checkInDate ? new Date(resident.checkInDate).toDateString() : "—"}</p></div>
          <div className="sm:col-span-2"><p className="text-gray-400">Emergency Contact</p><p className="text-gray-700">{resident.emergencyContact?.name} ({resident.emergencyContact?.relationship}) — {resident.emergencyContact?.phone}</p></div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
