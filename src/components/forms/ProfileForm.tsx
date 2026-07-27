"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Select from "react-select";
import countryList from "react-select-country-list";
import Image from "next/image"; 

interface Address {
  fullName?: string;
  phone?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

interface Profile {
  name?: string;
  email?: string;
  bio?: string;
  avatar?: string;
  billingAddress?: Address;
  shippingAddress?: Address;
}

export default function ProfileForm() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const router = useRouter();
  const countries = countryList().getData();

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/auth/profile", { credentials: "include" });
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (!res.ok) throw new Error("Erreur API");
        const data = await res.json();
        if (!data.name && data.email) {
          data.name = data.email.split("@")[0];
        }
        setProfile(data);
      } catch (err) {
        console.error("Erreur de chargement du profil", err);
        router.push("/login");
      }
    }
    fetchProfile();
  }, [router]);

  async function handleSave() {
    try {
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error("Erreur lors de la sauvegarde");
      alert("✅ Profil mis à jour !");
    } catch (err) {
      alert("❌ Impossible de mettre à jour le profil");
    }
  }

  if (!profile) return <p className="text-center py-10">Chargement...</p>;

  return (
    <form className="space-y-10 bg-white shadow-2xl rounded-2xl p-10 max-w-5xl mx-auto">
      {/* Profile Card */}
      <div className="flex flex-col items-center space-y-4">
        <Image
          src={profile.avatar || "/icons/avatar.png"}
          alt="Avatar"
          width={120}
          height={120}
          className="w-28 h-28 rounded-full border-4 border-blue-200 shadow-lg object-cover"
        />
        <h2 className="text-3xl font-bold text-gray-800">{profile.name || "User"}</h2>
        <p className="text-sm text-gray-500">{profile.email}</p>
      </div>

      {/* Personal Info */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-blue-600 border-b pb-2">Personal Information</h3>
        <label className="block">
          <span className="text-gray-700">Profile Name</span>
          <input
            type="text"
            value={profile.name || ""}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            className="mt-1 block w-full border rounded-lg px-3 py-2 shadow-sm focus:ring focus:ring-blue-300"
          />
        </label>
        <label className="block">
          <span className="text-gray-700">Bio</span>
          <textarea
            value={profile.bio || ""}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            className="mt-1 block w-full border rounded-lg px-3 py-2 shadow-sm focus:ring focus:ring-blue-300"
          />
        </label>
      </div>

      {/* Billing & Shipping côte à côte */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Billing Address */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-600 border-b pb-2">Billing Address</h3>
          <label className="block">
            <span className="text-gray-700">Billing Name</span>
            <input
              type="text"
              value={profile.billingAddress?.fullName || ""}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  billingAddress: { ...profile.billingAddress, fullName: e.target.value },
                })
              }
              className="mt-1 block w-full border rounded-lg px-3 py-2 shadow-sm focus:ring focus:ring-blue-300"
            />
          </label>
          <label className="block">
            <span className="text-gray-700">Phone</span>
            <input
              type="text"
              value={profile.billingAddress?.phone || ""}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  billingAddress: { ...profile.billingAddress, phone: e.target.value },
                })
              }
              className="mt-1 block w-full border rounded-lg px-3 py-2 shadow-sm focus:ring focus:ring-blue-300"
            />
          </label>
          <label className="block">
            <span className="text-gray-700">Street Address</span>
            <input
              type="text"
              value={profile.billingAddress?.streetAddress || ""}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  billingAddress: { ...profile.billingAddress, streetAddress: e.target.value },
                })
              }
              className="mt-1 block w-full border rounded-lg px-3 py-2 shadow-sm focus:ring focus:ring-blue-300"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-gray-700">City</span>
              <input
                type="text"
                value={profile.billingAddress?.city || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    billingAddress: { ...profile.billingAddress, city: e.target.value },
                  })
                }
                className="mt-1 block w-full border rounded-lg px-3 py-2 shadow-sm focus:ring focus:ring-blue-300"
              />
            </label>
            <label className="block">
              <span className="text-gray-700">State</span>
              <input
                type="text"
                value={profile.billingAddress?.state || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    billingAddress: { ...profile.billingAddress, state: e.target.value },
                  })
                }
                className="mt-1 block w-full border rounded-lg px-3 py-2 shadow-sm focus:ring focus:ring-blue-300"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-gray-700">Postal Code</span>
              <input
                type="text"
                value={profile.billingAddress?.postalCode || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    billingAddress: { ...profile.billingAddress, postalCode: e.target.value },
                  })
                }
                className="mt-1 block w-full border rounded-lg px-3 py-2 shadow-sm focus:ring focus:ring-blue-300"
              />
            </label>
            <label className="block">
              <span className="text-gray-700">Country</span>
              <Select
                options={countries}
                value={countries.find((c) => c.value === profile.billingAddress?.country)}
                onChange={(val) =>
                  setProfile({
                    ...profile,
                    billingAddress: { ...profile.billingAddress, country: val?.value },
                  })
                }
                placeholder="Select a country"
                className="mt-1"
              />
            </label>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-600 border-b pb-2">Shipping Address</h3>
          <label className="block">
            <span className="text-gray-700">Shipping Name</span>
            <input
              type="text"
              value={profile.shippingAddress?.fullName || ""}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  shippingAddress: { ...profile.shippingAddress, fullName: e.target.value },
                })
              }
              className="mt-1 block w-full border rounded-lg px-3 py-2 shadow-sm focus:ring focus:ring-blue-300"
            />
          </label>
          <label className="block">
            <span className="text-gray-700">Phone</span>
            <input
              type="text"
              value={profile.shippingAddress?.phone || ""}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  shippingAddress: { ...profile.shippingAddress, phone: e.target.value },
                })
              }
                            className="mt-1 block w-full border rounded-lg px-3 py-2 shadow-sm focus:ring focus:ring-blue-300"
            />
          </label>
          <label className="block">
            <span className="text-gray-700">Street Address</span>
            <input
              type="text"
              value={profile.shippingAddress?.streetAddress || ""}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  shippingAddress: { ...profile.shippingAddress, streetAddress: e.target.value },
                })
              }
              className="mt-1 block w-full border rounded-lg px-3 py-2 shadow-sm focus:ring focus:ring-blue-300"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-gray-700">City</span>
              <input
                type="text"
                value={profile.shippingAddress?.city || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    shippingAddress: { ...profile.shippingAddress, city: e.target.value },
                  })
                }
                className="mt-1 block w-full border rounded-lg px-3 py-2 shadow-sm focus:ring focus:ring-blue-300"
              />
            </label>
            <label className="block">
              <span className="text-gray-700">State</span>
              <input
                type="text"
                value={profile.shippingAddress?.state || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    shippingAddress: { ...profile.shippingAddress, state: e.target.value },
                  })
                }
                className="mt-1 block w-full border rounded-lg px-3 py-2 shadow-sm focus:ring focus:ring-blue-300"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-gray-700">Postal Code</span>
              <input
                type="text"
                value={profile.shippingAddress?.postalCode || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    shippingAddress: { ...profile.shippingAddress, postalCode: e.target.value },
                  })
                }
                className="mt-1 block w-full border rounded-lg px-3 py-2 shadow-sm focus:ring focus:ring-blue-300"
              />
            </label>
            <label className="block">
              <span className="text-gray-700">Country</span>
              <Select
                options={countries}
                value={countries.find((c) => c.value === profile.shippingAddress?.country)}
                onChange={(val) =>
                  setProfile({
                    ...profile,
                    shippingAddress: { ...profile.shippingAddress, country: val?.value },
                  })
                }
                placeholder="Select a country"
                className="mt-1"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={!profile}
        className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
      >
     
      </button>
    </form>
  );
}
