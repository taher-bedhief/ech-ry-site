"use client";

import { useState } from "react";
import type { AllProduct } from "@/types/product";
import { v4 as uuidv4 } from "uuid"; 

const AddProductForm = () => {
  const [formData, setFormData] = useState({
    originalId: "",
    title: "",
    description: "",
    shop_category: "",
    categories: "",
    unit_of_measure: "",
    price: "",
    oldPrice: "",
    promo: false,
    amount: "",
    supplier: "",
    lowStockThreshold: "",
    isActive: true,
    image: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<AllProduct[]>([]);
  const [searching, setSearching] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ logique promo : baisse = promo, hausse = pas promo
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrice = parseFloat(e.target.value);
    const oldPrice = parseFloat(formData.oldPrice);

    let newPromo = false;
    let updatedOldPrice = formData.oldPrice;

    if (!isNaN(newPrice) && !isNaN(oldPrice)) {
      if (newPrice < oldPrice) {
        newPromo = true;
      } else {
        newPromo = false;
        updatedOldPrice = newPrice.toString();
      }
    }

    setFormData({
      ...formData,
      price: e.target.value,
      oldPrice: updatedOldPrice,
      promo: newPromo,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const method = formData.originalId ? "PUT" : "POST"; // 🔑 différencier création / update
      const url = formData.originalId ? `/api/products/${formData.originalId}` : "/api/products";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          originalId: formData.originalId || uuidv4(),
          categories: formData.categories.split(",").map(c => c.trim()),
          price: parseFloat(formData.price),
          oldPrice: parseFloat(formData.oldPrice) || 0,
          promo: formData.promo,
          amount: parseInt(formData.amount),
          lowStockThreshold: parseInt(formData.lowStockThreshold),
          image: [formData.image],
          isActive: formData.isActive,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(method === "POST" ? "✅ Product created successfully!" : "✏️ Product updated successfully!");
        setFormData({
          originalId: "",
          title: "",
          description: "",
          shop_category: "",
          categories: "",
          unit_of_measure: "",
          price: "",
          oldPrice: "",
          promo: false,
          amount: "",
          supplier: "",
          lowStockThreshold: "",
          isActive: true,
          image: "",
        });
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      setMessage("💥 Error while saving product");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = search.trim();
    if (trimmed.length === 0) {
      setMessage("❗ Please enter at least one character to search");
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(trimmed)}&limit=5`);
      const data = await res.json();
      setResults(data.products || []);
    } catch (err) {
      console.error("❌ Search error:", err);
    } finally {
      setSearching(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        setResults(results.filter(p => p._id !== id && p.originalId !== id));
        setMessage("🗑️ Product deleted successfully!");
      } else {
        const data = await res.json();
        setMessage(`❌ Error while deleting: ${data.error}`);
      }
    } catch (err) {
      setMessage("💥 Server error while deleting");
    }
  };

  const handleEdit = (product: AllProduct) => {
    setFormData({
      originalId: product.originalId || product._id,
      title: product.title,
      description: product.description || "",
      shop_category: product.shop_category,
      categories: product.categories?.join(", ") || "",
      unit_of_measure: product.unit_of_measure || "",
      price: product.price?.toString() || "",
      oldPrice: product.oldPrice?.toString() || "",
      promo: product.promo ?? false,
      amount: product.amount?.toString() || "",
      supplier: product.supplier || "",
      lowStockThreshold: product.lowStockThreshold?.toString() || "",
      isActive: product.isActive ?? true,
      image: product.image?.[0] || "",
    });
    setMessage("✏️ Form pre-filled for editing");
  };

  const discountPercentage =
    formData.promo && parseFloat(formData.oldPrice) > 0
      ? Math.round(((parseFloat(formData.oldPrice) - parseFloat(formData.price)) / parseFloat(formData.oldPrice)) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          placeholder="🔍 Search for existing product..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 flex-1"
        />
        <button type="submit" className="bg-gray-700 text-white px-4 py-2 rounded">
          {searching ? "Searching..." : "Search"}
        </button>
      </form>

      {/* Search results */}
      {results.length > 0 && (
        <table className="w-full border-collapse border mt-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Name</th>
              <th className="border p-2">Category</th>
              <th className="border p-2">Shop</th>
              <th className="border p-2">Price</th>
              <th className="border p-2">Promo</th>
              <th className="border p-2">Stock</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {results.map((p) => (
              <tr key={p._id}>
                <td className="border p-2">{p.title}</td>
                <td className="border p-2">{p.categories?.join(", ")}</td>
                <td className="border p-2">{p.shop_category}</td>
                <td className="border p-2">
                  {p.promo && p.oldPrice > 0 ? (
                    <>
                      <span className="line-through text-gray-500 mr-2">{p.oldPrice} TND</span>
                      <span className="font-bold">{p.price} TND</span>
                      <span className="ml-2 text-red-600">
                        -{Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100)}%
                      </span>
                    </>
                  ) : (
                    <span>{p.price} TND</span>
                  )}
                </td>
                <td className="border p-2">{p.promo ? "Active" : "Inactive"}</td>
                <td className="border p-2">{p.amount}</td>
                <td className="border p-2">{p.isActive ? "Active" : "Inactive"}</td>
                <td className="border p-2 flex gap-2">
                  <button
                    onClick={() => handleEdit(p)}
                    className="bg-yellow-500 text-white px-2 py-1 rounded"
                  >
                    Edit
                  </button>
                                    <button
                    onClick={() => handleDelete(p._id)}
                    className="bg-red-600 text-white px-2 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Add / edit form */}
      <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded bg-white">
        <input type="hidden" name="originalId" value={formData.originalId} />

        <label className="block">
          <span className="text-gray-700">Product name</span>
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </label>

        <label className="block">
          <span className="text-gray-700">Description</span>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </label>

        <label className="block">
          <span className="text-gray-700">Shop category</span>
          <input
            name="shop_category"
            value={formData.shop_category}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </label>

        <label className="block">
          <span className="text-gray-700">Categories (comma separated)</span>
          <input
            name="categories"
            value={formData.categories}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </label>

        <label className="block">
          <span className="text-gray-700">Unit of measure</span>
          <input
            name="unit_of_measure"
            value={formData.unit_of_measure}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </label>

        <label className="block">
          <span className="text-gray-700">Previous Price</span>
          <input
            name="oldPrice"
            type="number"
            value={formData.oldPrice}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </label>

        <label className="block">
          <span className="text-gray-700">New Promo Price</span>
          <input
            name="price"
            type="number"
            value={formData.price}
            onChange={handlePriceChange}
            className="w-full border p-2 rounded"
          />
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" name="promo" checked={formData.promo} readOnly />
          Promo active
        </label>

        {formData.promo && discountPercentage > 0 && (
          <p className="text-green-600">Discount: -{discountPercentage}%</p>
        )}

        <label className="block">
          <span className="text-gray-700">Stock</span>
          <input
            name="amount"
            type="number"
            value={formData.amount}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </label>

        <label className="block">
          <span className="text-gray-700">Supplier</span>
          <input
            name="supplier"
            value={formData.supplier}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </label>

        <label className="block">
          <span className="text-gray-700">Low stock threshold</span>
          <input
            name="lowStockThreshold"
            type="number"
            value={formData.lowStockThreshold}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          />
          Active product
        </label>

        <label className="block">
          <span className="text-gray-700">Image URL</span>
          <input
            name="image"
            value={formData.image}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Submitting..." : "Save product"}
        </button>

        {message && <p className="mt-2">{message}</p>}
      </form>
    </div>
  );
};

export default AddProductForm;
