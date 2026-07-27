import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Order } from "@/types/order";
import Image from "next/image";
import { HiTrash } from "react-icons/hi";

type OrderTableProps = {
  items: Order["items"];
  onDelete?: (orderId: string) => Promise<void>;
};

export function OrderTable({ items, onDelete }: OrderTableProps) {
  return (
    <Table className="mt-5 table-auto">
      <TableHeader className="bg-accent w-full">
        <TableRow className="w-full">
          <TableHead>Item</TableHead>
          <TableHead className="text-center">Quantity</TableHead>
          <TableHead className="text-right">Price</TableHead>
          {onDelete && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item._id || `order-item-${item.productId}`}>
            <TableCell className="font-medium">
              <div className="flex gap-3 items-center">
                <Image
                  src={item.image || "/placeholder.jpg"}   // ✅ utilise directement item.image
                  width={40}
                  height={40}
                  alt={item.title || "Product Unavailable"} // ✅ utilise directement item.title
                  className="rounded-lg object-cover"
                />
                <div>
                  {item.title ? (
                    <span className="hover:text-primary hover:underline">{item.title}</span>
                  ) : (
                    <span className="text-gray-500">Product Unavailable</span>
                  )}
                  <p className="text-xs text-primary mt-1">
                    <span>${(item.price || 0).toFixed(2)}</span>
                  </p>
                </div>
              </div>
            </TableCell>
            <TableCell className="text-center">{item.quantity || 0}</TableCell>
            <TableCell className="text-right">
              ${((item.price || 0) * (item.quantity || 0)).toFixed(2)}
            </TableCell>
            {onDelete && (
              <TableCell className="text-right">
                <button
                  onClick={() => onDelete(item._id || item.productId)}
                  className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                >
                  <HiTrash className="w-4 h-4" /> Delete
                </button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Total</TableCell>
          <TableCell></TableCell>
          <TableCell className="text-right">
            ${items.reduce((total, item) => total + (item.price || 0) * (item.quantity || 0), 0).toFixed(2)}
          </TableCell>
          {onDelete && <TableCell></TableCell>}
        </TableRow>
      </TableFooter>
    </Table>
  );
}
