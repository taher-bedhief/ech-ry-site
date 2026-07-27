"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import Paginations from "@/components/Paginations";

type Product = {
  _id: string;
  originalId: string;
  title: string;
  image?: string | string[];
  shop_category: string;
  unit_of_measure: string;
  price: number;
  supplier?: string;
  amount: number;
  reserved: number;
  sales: number;
  lowStockThreshold: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  status: "Active" | "Warning" | "Inactive" | "OutOfStock";
};

export default function StockDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lowCurrentPage, setLowCurrentPage] = useState<number>(1);
  const pageSize = 10;

  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [quickFilter, setQuickFilter] = useState<"all" | "low" | "deactivated">("all");

  const lastUpdateRef = useRef<string | null>(null);

  // ================= Fetch produits modifiés =================
  const fetchUpdatedProducts = useCallback(async () => {
    setLoading(true);
    try {
      const url = lastUpdateRef.current
        ? `/api/products/dashboard?updatedAfter=${encodeURIComponent(lastUpdateRef.current)}`
        : `/api/products/dashboard`;

      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      const updatedProducts: Product[] = data.products;

      if (updatedProducts.length > 0) {
        setProducts((prev) => {
          const mapPrev = new Map(prev.map((p) => [p._id, p]));
          updatedProducts.forEach((p) => {
            mapPrev.set(p._id, p);
          });
          return Array.from(mapPrev.values()).sort((a, b) => a.title.localeCompare(b.title));
        });

        // mettre à jour lastUpdateRef
        const latestUpdated = updatedProducts
          .map((p) => new Date(p.updatedAt).toISOString())
          .sort()
          .pop();
        if (latestUpdated) lastUpdateRef.current = latestUpdated;
      }
    } catch (err) {
      console.error("💥 [fetchUpdatedProducts] Erreur:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ================= Chargement initial + polling =================
  useEffect(() => {
    fetchUpdatedProducts();
    const interval = setInterval(fetchUpdatedProducts, 10000); // toutes les 10 sec
    return () => clearInterval(interval);
  }, [fetchUpdatedProducts]);

  // ================= Fonctions de mise à jour =================
  const updateStock = async (id: string, delta: number) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockDelta: delta }),
      });
      const updated = await res.json();
      const updatedProduct: Product = updated.product;

      setProducts((prev) =>
        prev.map((p) =>
          p._id === updatedProduct._id || p.originalId === updatedProduct.originalId
            ? {
                ...p,
                amount: updatedProduct.amount,
                reserved: updatedProduct.reserved,
                sales: updatedProduct.sales,
                status: updatedProduct.status,
              }
            : p
        )
      );
    } catch (err) {
      console.error("💥 [updateStock] Erreur:", err);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      });
      const updated = await res.json();
      const updatedProduct: Product = updated.product;

      setProducts((prev) =>
        prev.map((p) =>
          p._id === updatedProduct._id || p.originalId === updatedProduct.originalId
            ? { ...p, isActive: updatedProduct.isActive, status: updatedProduct.status }
            : p
        )
      );
    } catch (err) {
      console.error("💥 [toggleActive] Erreur:", err);
    }
  };

  // ================= Helpers =================
  const renderStatus = (p: Product) => {
    switch (p.status) {
      case "Inactive":
        return <span className="text-gray-500 font-bold">Inactive</span>;
      case "Warning":
        return <span className="text-orange-500 font-bold">Warning</span>;
      case "OutOfStock":
        return <span className="text-red-600 font-bold">Out of Stock</span>;
      default:
        return <span className="text-green-600 font-bold">Active</span>;
    }
  };

  const getImageSrc = (image?: string | string[]) => {
    if (Array.isArray(image) && image.length > 0) return image[0];
    if (typeof image === "string" && image.trim() !== "") return image;
    return "/placeholder.jpg";
  };

  // ================= Statistiques =================
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + (p.amount ?? 0), 0);
  const totalReserved = products.reduce((sum, p) => sum + (p.reserved ?? 0), 0);
  const totalSales = products.reduce((sum, p) => sum + (p.sales ?? 0), 0);
  const deactivatedCount = products.filter((p) => !p.isActive).length;
  const lowStockProducts = products.filter(
    (p) => p.amount <= (p.lowStockThreshold || 5) && p.isActive
  );

  // ================= Filtrage =================
  const filteredProducts = products
    .filter((p) => (selectedCategory ? p.shop_category === selectedCategory : true))
    .filter((p) => {
      const normalizedSearch = searchTerm.trim().toLowerCase();
      const searchableString = [
        p.title,
        p.shop_category,
        p.unit_of_measure,
        p.supplier,
        p.status,
        p.price?.toString(),
        p.amount?.toString(),
        p.sales?.toString(),
        p.reserved?.toString(),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchableString.includes(normalizedSearch);
    })
    .filter((p) => {
      if (quickFilter === "low") return p.amount <= (p.lowStockThreshold || 5) && p.isActive;
      if (quickFilter === "deactivated") return !p.isActive;
      return true;
    });

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const paginatedLowStock = lowStockProducts.slice(
    (lowCurrentPage - 1) * pageSize,
    lowCurrentPage * pageSize
  );

  // ================= Export CSV =================
  const exportCSV = () => {
    if (products.length === 0) return;
    const rows = products.map((p) => ({
      Title: p.title,
      Category: p.shop_category,
      Price: p.price,
      Stock: p.amount,
      Reserved: p.reserved,
      Sales: p.sales,
      Supplier: p.supplier ?? "N/A",
      Status: p.status,
      LowStockThreshold: p.lowStockThreshold,
      Created: new Date(p.createdAt).toLocaleDateString(),
      Updated: new Date(p.updatedAt).toLocaleDateString(),
    }));
    const csv = [Object.keys(rows[0]).join(","), ...rows.map((r) => Object.values(r).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products.csv";
    a.click();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500" />
      </div>
    );
  }

  // ================= JSX =================
  return (
    <div className="p-6 space-y-10">
      <h1 className="text-2xl font-bold mb-4">📦 Stock Dashboard</h1>

      {/* Résumé */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div
          className="bg-white shadow rounded p-4 text-center cursor-pointer"
          onClick={() => setQuickFilter("all")}
        >
          <p className="text-sm text-gray-500">Total Products</p>
          <p className="text-2xl font-bold">{totalProducts}</p>
        </div>
        <div className="bg-white shadow rounded p-4 text-center">
          <p className="text-sm text-gray-500">Total Units in Stock</p>
          <p className="text-2xl font-bold text-green-600">{totalStock}</p>
        </div>
        <div className="bg-white shadow rounded p-4 text-center">
          <p className="text-sm text-gray-500">Total Reserved</p>
          <p className="text-2xl font-bold text-blue-600">{totalReserved}</p>
        </div>
        <div className="bg-white shadow rounded p-4 text-center">
          <p className="text-sm text-gray-500">Total Sales</p>
          <p className="text-2xl font-bold text-purple-600">{totalSales}</p>
        </div>
        <div
          className="bg-white shadow rounded p-4 text-center cursor-pointer"
          onClick={() => setQuickFilter("low")}
        >
          <p className="text-sm text-gray-500">Low Stock Products</p>
          <p className="text-2xl font-bold text-orange-500">{lowStockProducts.length}</p>
        </div>
        <div
          className="bg-white shadow rounded p-4 text-center cursor-pointer"
          onClick={() => setQuickFilter("deactivated")}
        >
          <p className="text-sm text-gray-500">Deactivated Products</p>
          <p className="text-2xl font-bold text-gray-500">{deactivatedCount}</p>
        </div>
        <div className="flex items-center justify-center">
          <button
            onClick={exportCSV}
            className="bg-blue-500 text-white px-3 py-1 text-sm rounded shadow"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Recherche & Filtre */}
      <div className="flex gap-4 mb-6">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border rounded p-2"
        >
          <option value="">All Categories</option>
          {[...new Set(products.map((p) => p.shop_category))].map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border rounded p-2 flex-1"
        />
      </div>

      {/* Table All Products */}
      <div>
        <h2 className="text-xl font-semibold mb-2">All Products</h2>
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Image</th>
              <th className="p-2">Product</th>
              <th className="p-2">Category</th>
              <th className="p-2">Unit</th>
              <th className="p-2">Price</th>
              <th className="p-2">Stock</th>
              <th className="p-2">Reserved</th>
              <th className="p-2">Sales</th>
              <th className="p-2">Supplier</th>
              <th className="p-2">Low Stock Threshold</th>
              <th className="p-2">Status</th>
              <th className="p-2">Created</th>
              <th className="p-2">Updated</th>
              <th className="p-2">Actions</th>
              <th className="p-2">Admin</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.map((p) => (
              <tr key={p._id} className="border-t">
                <td className="p-2">
                  <Image
                    src={getImageSrc(p.image)}
                    alt={p.title}
                    width={64}
                    height={64}
                    className="object-cover rounded"
                  />
                </td>
                <td className="p-2">{p.title}</td>
                <td className="p-2">{p.shop_category}</td>
                <td className="p-2">{p.unit_of_measure}</td>
                <td className="p-2">{p.price} TND</td>
                <td className="p-2">{p.amount}</td>
                <td className="p-2">{p.reserved}</td>
                <td className="p-2">{p.sales}</td>
                <td className="p-2">{p.supplier ?? "N/A"}</td>
                <td className="p-2">{p.lowStockThreshold}</td>
                <td className="p-2">{renderStatus(p)}</td>
                <td className="p-2">{new Date(p.createdAt).toLocaleDateString()}</td>
                <td className="p-2">{new Date(p.updatedAt).toLocaleDateString()}</td>
                <td className="p-2">
                  <button
                    onClick={() => updateStock(p._id, +1)}
                    className="px-2 py-1 bg-green-500 text-white rounded mr-2"
                  >
                    +
                  </button>
                  <button
                    onClick={() => updateStock(p._id, -1)}
                    className="px-2 py-1 bg-red-500 text-white rounded"
                  >
                    -
                  </button>
                </td>
                <td className="p-2">
                  <button
                    onClick={() => toggleActive(p._id, p.isActive)}
                    className={`px-2 py-1 rounded ${
                      p.isActive ? "bg-gray-400 text-white" : "bg-blue-500 text-white"
                    }`}
                  >
                    {p.isActive ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <Paginations
          totalCount={filteredProducts.length}
          currentPage={currentPage}
          totalPages={Math.ceil(filteredProducts.length / pageSize)}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* LOW STOCK SECTION */}
      <div>
        <h2 className="text-xl font-semibold mb-2 text-orange-600">
          ⚠ Low Stock Products
        </h2>
        {lowStockProducts.length === 0 ? (
          <p className="text-gray-500">No products under threshold.</p>
        ) : (
          <>
            <table className="w-full border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2">Product</th>
                  <th className="p-2">Stock</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLowStock.map((p) => (
                  <tr key={p._id} className="border-t">
                    <td className="p-2">{p.title}</td>
                    <td className="p-2 text-orange-500 font-bold">{p.amount}</td>
                    <td className="p-2">{renderStatus(p)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Paginations
              totalCount={lowStockProducts.length}
              currentPage={lowCurrentPage}
              totalPages={Math.ceil(lowStockProducts.length / pageSize)}
              onPageChange={setLowCurrentPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
