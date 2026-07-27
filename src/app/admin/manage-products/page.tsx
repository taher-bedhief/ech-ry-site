import AddProductForm from "@/components/forms/AddProductForm";

export default function ManageProductsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Gestion des Produits</h1>
      <AddProductForm />
    </div>
  );
}
